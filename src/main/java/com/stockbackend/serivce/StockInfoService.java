package com.stockbackend.serivce;

import com.google.gson.JsonElement;
import com.stockbackend.utils.DateUtils;
import com.stockbackend.utils.JDBCUtils;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.ParseException;
import org.springframework.beans.factory.annotation.Autowired;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;

import java.io.IOException;
import java.net.URI;
import java.sql.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class StockInfoService {
    @Autowired
    private JDBCUtils jdbcUtils;
    @Autowired
    private DateUtils dut;

    // 获取最新交易日期
    public String getLastTradeDay() {
        String url = "http://74.push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.000001" +
                "&fields1=f1&fields2=f51&klt=101&fqt=1&end=20500101&lmt=1&_=" + System.currentTimeMillis();
        String result = "";
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(url);
            CloseableHttpResponse response = client.execute(request);
            if (response.getCode() == 200) {
                String jsonResponse = EntityUtils.toString(response.getEntity());
                // 使用 Gson 解析 JSON
                JsonParser parser = new JsonParser();
                JsonObject jsonObject = parser.parse(jsonResponse).getAsJsonObject();
                JsonObject data = jsonObject.getAsJsonObject("data");
                JsonArray klines = data.getAsJsonArray("klines");
                result = klines.get(0).getAsString();
            } else {
                System.out.println("GET request not worked");
            }

        } catch (IOException e) {
            e.printStackTrace();
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
        return result;
    }

    // 获取当日交易数据
    public void getDailyTradeData() throws Exception {
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        DateUtils stockInfoService = new DateUtils();
        String url = "http://94.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=99999&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281" +
                "&fltt=2&invt=2&wbp2u=%7C0%7C0%7C0%7Cweb&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048" +
                "&fields=f12,f17,f2,f15,f16,f5,f3,f18,f4,f7,f6&_=" + timestamp;
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet getRequest = new HttpGet(new URI(url));
            CloseableHttpResponse response = httpClient.execute(getRequest);
            if (response.getCode() == 200) {
                String jsonResponse = EntityUtils.toString(response.getEntity());
                JsonParser jsonParser = new JsonParser();
                JsonObject jsonObject = jsonParser.parse(jsonResponse).getAsJsonObject();
                JsonArray datas = jsonObject.getAsJsonObject("data").getAsJsonArray("diff");
                List<Object[]> insertData = new ArrayList<>();
                String tradeDate = stockInfoService.formatDateString(getLastTradeDay(), "yyyyMMdd");

                ZoneId zone = ZoneId.of("Asia/Shanghai");
                // 通过ZoneId来获取东八区的当前时间
                ZonedDateTime currentDateTime = ZonedDateTime.now(zone);
                // 格式化输出日期时间
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
                String localDate = currentDateTime.format(formatter);
                // 如果交易日日期和本地时间不同说明今天不是交易日
                if (!tradeDate.equals(localDate)) {
                    return;
                }

                for (JsonElement data : datas) {
                    JsonObject item = data.getAsJsonObject();
                    String stockCode = item.get("f12").getAsString();
                    if (stockCode.startsWith("6")) {
                        stockCode += ".SH";
                    } else {
                        stockCode += ".SZ";
                    }
                    if (!stockCode.startsWith("60") && !stockCode.startsWith("00")) {
                        continue;
                    }
                    if (Objects.equals(item.get("f17").getAsString(), "-")) {
                        continue;
                    }
                    double openPrice = item.get("f17").getAsDouble();
                    if (Double.isNaN(openPrice)) {
                        continue;
                    }
                    double closePrice = item.get("f2").getAsDouble();
                    double highPrice = item.get("f15").getAsDouble();
                    double lowPrice = item.get("f16").getAsDouble();
                    double volume = item.get("f5").getAsDouble();
                    double changePrice = item.get("f4").getAsDouble();
                    double pctChg = item.get("f3").getAsDouble();
                    double maxPctChg = item.get("f7").getAsDouble();
                    double amount = item.get("f6").getAsDouble();

                    Object[] dataItem = {stockCode, openPrice, closePrice, highPrice, lowPrice, volume,
                            changePrice, tradeDate, pctChg, maxPctChg, amount};
                    insertData.add(dataItem);
                }
                //清空原来的已有的数据
                deleteTradeDataWithDate(tradeDate);

                Connection connection = jdbcUtils.getConnection();
                String sql = "INSERT IGNORE INTO StockTradeInfo (stockCode, open, close, high, low, vol, changePrice, tradeDate, pct_chg, max_pct_chg, amount) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                connection.setAutoCommit(false);
                try (PreparedStatement statement = connection.prepareStatement(sql)) {
                    for (Object[] dataItem : insertData) {
                        for (int i = 0; i < dataItem.length; i++) {
                            if (dataItem[i] instanceof Double) {
                                statement.setDouble(i + 1, (Double) dataItem[i]);
                            } else {
                                statement.setString(i + 1, (String) dataItem[i]);
                            }
                        }
                        statement.addBatch();
                    }
                    statement.executeBatch();
                    connection.commit();
                }
            }
        }
    }

    // 获取指定日期的交易数据
    public void getDailyTradeData(String tradeDate) throws Exception {
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        DateUtils stockInfoService = new DateUtils();
        String url = "http://94.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=99999&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281" +
                "&fltt=2&invt=2&wbp2u=%7C0%7C0%7C0%7Cweb&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048" +
                "&fields=f12,f17,f2,f15,f16,f5,f3,f18,f4,f7,f6&_=" + timestamp;
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet getRequest = new HttpGet(new URI(url));
            CloseableHttpResponse response = httpClient.execute(getRequest);
            if (response.getCode() == 200) {
                String jsonResponse = EntityUtils.toString(response.getEntity());
                JsonParser jsonParser = new JsonParser();
                JsonObject jsonObject = jsonParser.parse(jsonResponse).getAsJsonObject();
                JsonArray datas = jsonObject.getAsJsonObject("data").getAsJsonArray("diff");
                List<Object[]> insertData = new ArrayList<>();
                tradeDate = dut.formatDateString(tradeDate, "yyyyMMdd");

                ZoneId zone = ZoneId.of("Asia/Shanghai");
                // 通过ZoneId来获取东八区的当前时间
                ZonedDateTime currentDateTime = ZonedDateTime.now(zone);
                // 格式化输出日期时间
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
                String localDate = currentDateTime.format(formatter);
                // 如果交易日日期和本地时间不同说明今天不是交易日
                if (!tradeDate.equals(localDate)) {
                    return;
                }

                for (JsonElement data : datas) {
                    JsonObject item = data.getAsJsonObject();
                    String stockCode = item.get("f12").getAsString();
                    if (stockCode.startsWith("6")) {
                        stockCode += ".SH";
                    } else {
                        stockCode += ".SZ";
                    }
                    if (!stockCode.startsWith("60") && !stockCode.startsWith("00")) {
                        continue;
                    }
                    if (Objects.equals(item.get("f17").getAsString(), "-")) {
                        continue;
                    }
                    double openPrice = item.get("f17").getAsDouble();
                    if (Double.isNaN(openPrice)) {
                        continue;
                    }
                    double closePrice = item.get("f2").getAsDouble();
                    double highPrice = item.get("f15").getAsDouble();
                    double lowPrice = item.get("f16").getAsDouble();
                    double volume = item.get("f5").getAsDouble();
                    double changePrice = item.get("f4").getAsDouble();
                    double pctChg = item.get("f3").getAsDouble();
                    double maxPctChg = item.get("f7").getAsDouble();
                    double amount = item.get("f6").getAsDouble();

                    Object[] dataItem = {stockCode, openPrice, closePrice, highPrice, lowPrice, volume,
                            changePrice, tradeDate, pctChg, maxPctChg, amount};
                    insertData.add(dataItem);
                }
                //清空原来的已有的数据
                deleteTradeDataWithDate(tradeDate);

                Connection connection = jdbcUtils.getConnection();
                String sql = "INSERT IGNORE INTO StockTradeInfo (stockCode, open, close, high, low, vol, changePrice, tradeDate, pct_chg, max_pct_chg, amount) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                connection.setAutoCommit(false);
                try (PreparedStatement statement = connection.prepareStatement(sql)) {
                    for (Object[] dataItem : insertData) {
                        for (int i = 0; i < dataItem.length; i++) {
                            if (dataItem[i] instanceof Double) {
                                statement.setDouble(i + 1, (Double) dataItem[i]);
                            } else {
                                statement.setString(i + 1, (String) dataItem[i]);
                            }
                        }
                        statement.addBatch();
                    }
                    statement.executeBatch();
                    connection.commit();
                }
            }
        }
    }
    // 获取股票基础信息
    public void getBasicStockInfo() {
        String url = "http://70.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=99999&po=1&np=1&fltt=2&invt=2" +
                "&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&_=1680702959503&fields=f12,f14";
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(url);
            CloseableHttpResponse response = client.execute(request);
            if (response.getCode() == 200) {
                List<String[]> insertData = new ArrayList<>();
                String jsonResponse = EntityUtils.toString(response.getEntity());
                // 使用 Gson 解析 JSON
                JsonParser parser = new JsonParser();
                JsonObject jsonObject = parser.parse(jsonResponse).getAsJsonObject();
                JsonArray datas = jsonObject.getAsJsonObject("data").getAsJsonArray("diff");
                for (JsonElement data : datas) {
                    JsonObject item = data.getAsJsonObject();
                    String code = item.get("f12").getAsString();
                    if (code.startsWith("60") | code.startsWith("68")) {
                        code = code + ".SH";
                    } else {
                        code = code + ".SZ";
                    }
                    String name = item.get("f14").getAsString();
                    String[] dataItem = {code, name};
                    insertData.add(dataItem);
                }
                String sql = "INSERT INTO StockBasicInfo(stockCode,stockName) VALUES(?,?)";
                try (Connection connection = jdbcUtils.getConnection();
                     PreparedStatement statementTruncate =
                             connection.prepareStatement("truncate table  stockdata.stockbasicinfo");
                     PreparedStatement statement = connection.prepareStatement(sql)) {
                    connection.setAutoCommit(false);
                    statementTruncate.execute();
                    for (String[] dataItem : insertData) {
                        for (int i = 0; i < dataItem.length; i++) {
                            statement.setString(i + 1, dataItem[i]);
                        }
                        statement.addBatch();
                    }
                    statement.executeBatch();
                    connection.commit();

                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 获取历史数据
    public void getHisStockData(String stockCode) {
        String stockCodeQuery = stockCode;
        String formatCode = stockCode;
        if (stockCode.startsWith("6")) {
            stockCodeQuery = "1." + stockCode;
            formatCode = stockCode + ".SH";
        } else {
            stockCodeQuery = "0." + stockCode;
            formatCode = stockCode + ".SZ";
        }

        String url = "http://push2his.eastmoney.com/api/qt/stock/kline/get?fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13" +
                "&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&beg=0&end=20500101" +
                "&rtntype=6&secid=" + stockCodeQuery + "&klt=101&fqt=1";
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet getRequest = new HttpGet(new URI(url));
            CloseableHttpResponse response = httpClient.execute(getRequest);
            if (response.getCode() == 200) {
                String jsonResponse = EntityUtils.toString(response.getEntity());
                JsonParser jsonParser = new JsonParser();
                JsonObject jsonObject = jsonParser.parse(jsonResponse).getAsJsonObject();
                JsonArray datas = jsonObject.getAsJsonObject("data").getAsJsonArray("klines");
                List<Object[]> insertData = new ArrayList<>();
                String tradeDate = "";
                for (JsonElement data : datas) {
                    String dataString = data.getAsString();
                    String[] dataItem = dataString.split(",");
                    tradeDate = dut.formatDateString(dataItem[0], "yyyyMMdd");
                    insertData.add(new Object[]{formatCode
                            , tradeDate
                            , Float.parseFloat(dataItem[1])
                            , Float.parseFloat(dataItem[2])
                            , Float.parseFloat(dataItem[3])
                            , Float.parseFloat(dataItem[4])
                            , Integer.parseInt(dataItem[5])
                            , Float.parseFloat(dataItem[6])
                            , Float.parseFloat(dataItem[7])
                            , Float.parseFloat(dataItem[8])
                            , Float.parseFloat(dataItem[9])
                    });
                }
                String sql = "INSERT INTO StockTradeInfo (stockCode,tradeDate, open, close, high, low, vol" +
                        ", amount, max_pct_chg, pct_chg, changeprice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                try (Connection connection = jdbcUtils.getConnection();
                     PreparedStatement statement = connection.prepareStatement(sql);) {
                    connection.setAutoCommit(false);
                    for (Object[] dataItem : insertData) {
                        for (int i = 0; i < dataItem.length; i++) {
                            if (dataItem[i] instanceof Float) {
                                statement.setDouble(i + 1, (Float) dataItem[i]);
                            } else if (dataItem[i] instanceof Integer) {
                                statement.setInt(i + 1, (Integer) dataItem[i]);
                            } else {
                                statement.setString(i + 1, (String) dataItem[i]);
                            }
                        }
                        statement.addBatch();
                    }
                    statement.executeBatch();
                    connection.commit();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 获取所有历史数据
    public void getAllHisStockData() {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        final int batchSize = 100; // 每次提交的任务数量
        List<Future<?>> futures = new ArrayList<>();
        //先清空全部数据
        truncateTradeInfo();
        try (Connection connection = jdbcUtils.getConnection();
             Statement statement = connection.createStatement()) {
            String sql = "SELECT stockCode FROM StockBasicInfo";
            ResultSet resultSet = statement.executeQuery(sql);
            int count = 0;

            while (resultSet.next()) {
                String stockCode = resultSet.getString(1).split("\\.")[0];
                futures.add(executor.submit(() -> getHisStockData(stockCode)));
                count++;

                if (count % batchSize == 0) {
                    // 等待这批任务完成
                    for (Future<?> future : futures) {
                        future.get();
                    }
                    futures.clear();
                }
            }
            // 等待最后一批任务完成
            for (Future<?> future : futures) {
                future.get();
            }

        } catch (SQLException | InterruptedException | ExecutionException e) {
            e.printStackTrace();
        } finally {
            executor.shutdown();
        }
    }

    //清空指定日期数据
    public void deleteTradeDataWithDate(String tradeDate) {
        String sql = String.format("delete table stocktradeinfo where tradeDate=%s", tradeDate);
        try (Connection connection = jdbcUtils.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.execute();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    //清空所有交易数据
    public void truncateTradeInfo() {
        String sql = "truncate table stocktradeinfo";
        try (Connection connection = jdbcUtils.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)
        ) {
            statement.execute();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }
}
