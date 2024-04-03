package com.stockbackend.serivce;

import com.google.gson.*;
import com.stockbackend.utils.JDBCUtils;
import net.minidev.json.JSONObject;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.ParseException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.net.URI;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@SpringBootTest
public class StockInfoServiceTest {
    @Autowired
    private JDBCUtils jdbcUtils;

    @Test
    public String formateDateString(String originDate) {
        LocalDate date = LocalDate.parse(originDate, DateTimeFormatter.ISO_DATE);

        // Format the date as a string in the desired format
        String formattedDate = date.format(DateTimeFormatter.BASIC_ISO_DATE);
        return formattedDate;
    }


    @Test
    public String getLastTradeDay() {
        String url = "http://74.push2his.eastmoney.com/api/qt/stock/kline/get?secid=1.000001" +
                "&fields1=f1&fields2=f51&klt=101&fqt=1&end=20500101&lmt=1&_=" + System.currentTimeMillis();
        String lastDate = "";
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(url);
            try (CloseableHttpClient client = HttpClients.createDefault();
                 CloseableHttpResponse response = client.execute(request)) {
                if (response.getCode() == 200) {
                    String jsonResponse = EntityUtils.toString(response.getEntity());
                    // 使用 Gson 解析 JSON
                    JsonParser parser = new JsonParser();
                    JsonObject jsonObject = parser.parse(jsonResponse).getAsJsonObject();
                    JsonObject data = jsonObject.getAsJsonObject("data");
                    JsonArray klines = data.getAsJsonArray("klines");
                    lastDate = klines.get(0).getAsString();
                } else {
                    System.out.println("GET request not worked");
                }
            } catch (ParseException e) {
                throw new RuntimeException(e);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return lastDate;
    }

    @Test
    public void getDailyTradeData() throws Exception {
        String timestamp = String.valueOf(Instant.now().toEpochMilli());
        StockInfoServiceTest stockInfoService = new StockInfoServiceTest();
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
                String tradeDate = stockInfoService.formateDateString(stockInfoService.getLastTradeDay());
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
}
