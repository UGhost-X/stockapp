package com.stockbackend.component;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.stockbackend.utils.TailLogThread;
import com.stockbackend.utils.ToolsUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.HtmlUtils;

import java.io.*;
import java.lang.reflect.Type;
import java.util.*;

import static java.lang.Thread.sleep;

/**
 * <p>Title: Websocket处理器 - WebSocketHandler_ShowLog</p>
 *
 * <p>Description:统一发送信息等操作的</p>
 *
 * <p>Copyright: Copyright Faker(c) 2018</p>
 *
 * <p>Company: 无</p>
 *
 * @author Anlinxi
 *
 * @version 1.0
 */
@Slf4j
public class WebSocketHandler_ShowLog extends TextWebSocketHandler {


    /**储存分组信息 分组名:用户分组list*/
    public static final Map<Object, WebSocketSession> userSocketSessionMap;
    static {
        userSocketSessionMap = new HashMap<Object, WebSocketSession>();
    }

    /**实例化的类*/
    public static WebSocketHandler_ShowLog webSocketHandler;
    /**运行的日志程序cmd*/
    private static Process process;
    /**输入流*/
    private static InputStream inputStream;
    private Gson gson = new Gson();
    /**
     * 实例化方法
     * @return webSocketHandler
     */
    public static WebSocketHandler_ShowLog getBeans(){
        if(webSocketHandler == null){
            webSocketHandler = new WebSocketHandler_ShowLog();
        }
        return webSocketHandler;
    }

    /**
     * 处理前端发送的文本信息
     * js调用websocket.send时候，会调用该方法
     * @param session session
     * @param message 发送信息
     * @throws Exception 异常
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (message.getPayloadLength() == 0) {
            return;
        }

        String payload = message.getPayload();

        // Using Gson to convert the JSON message to a Map<String, Object>
        Type type = new TypeToken<Map<String, Object>>() {}.getType();
        Map<String, Object> msg = gson.fromJson(payload, type);

        log.info("handleMessage......." + payload + "..........." + msg);
        session.sendMessage(message);

        // Call your method here (send message to all users)
        sendMessageToAllUsers(msg.get("msgContent").toString());
    }

    /**
     * 当新连接建立的时候，被调用
     * 连接成功时候，会触发页面上onOpen方法
     * @param session session
     * @throws Exception 异常
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String uid = (String) session.getAttributes().get("WEBSOCKET_SL_ID");
        if (userSocketSessionMap.get(uid) == null) {//获取用户id
            uid = session.getId();
            userSocketSessionMap.put(uid, session);
        }
        log.info("======"+uid+" 建立连接完成======");
        //读取配置文件里日志文件地址
        String fileAddr = ToolsUtil.getInstence().getProperties("myConfig","log.tomcat.catalina");
        if(ToolsUtil.isNotNull(fileAddr)){
            //读取现有日志信息
            this.readCatalinaFile(fileAddr,session);
            //进程为空或者未激活时执行cmd命令
            // 执行tail -f命令
            String cmd = "tail -f "+fileAddr;
            try {
                process = Runtime.getRuntime().exec(cmd);
                inputStream = process.getInputStream();
                if(process.isAlive()){
                    // 一定要启动新的线程，防止InputStream阻塞处理WebSocket的线程
                    TailLogThread thread = new TailLogThread(inputStream, session );
                    thread.start();
                }
            } catch (IOException e) {
                //log.error(cmd);
                System.err.println(cmd);
                e.printStackTrace();
                this.close();
            }

        }else{
            log.error("======未配置myConfig文件中log.tomcat.catalina属性(tomcat日志路径)======");
        }
    }

    /**
     * 读取现有日志信息
     * @param fileAddr 文件地址
     * @param session WebSocketSession
     */
    private void readCatalinaFile(String fileAddr, WebSocketSession session) {
        Map<String,Object> result = new HashMap<>(4);
        FileInputStream inStream  = null;
        try {
            File file = new File(fileAddr);
            //如果文件夹不存在，先创建文件夹
            if(!file.exists()){
                System.err.println("文件不存在");
                return;
            }
//            inStream = new FileInputStream(file);
//            String bm =  CpdetectorUtils.getInstence().getFileOrIOEncode(fileAddr,"file");
            InputStreamReader isr = new InputStreamReader(inStream, "GBK");
            BufferedReader reader = new BufferedReader(isr);
            String pythonText;
            //读取的一行
            String readline;
            List<String> sbList = new ArrayList();
            while((readline = reader.readLine())!=null){
                sbList.add(this.setColorToMsg(readline));
            }
            reader.close();
            int rowsNum  = sbList.size();
            int sendNum  = 0;
            StringBuffer sb = new StringBuffer();
            for(String l:sbList){
                if(1<=rowsNum&&rowsNum<=400){
                    sb.append(l);
                }
                if(sb.length()>4096){
                    session.sendMessage(new TextMessage(sb.toString()));
                    sb.setLength(0);
                    sendNum++;
                    try {
                        //发送一次的时间间隔，给浏览器反映的时间
                        sleep(20);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                else if(rowsNum<=1&&sb.length()>0){
                    session.sendMessage(new TextMessage(sb.toString()));
                    sb.setLength(0);
                    sendNum++;
                }
                rowsNum--;
            }

            log.info("原始日志共计"+sbList.size()+"行。发送信息"+sendNum+"次。");
            session.sendMessage(new TextMessage(System.lineSeparator()+System.lineSeparator()+"最近日志加载完毕......"+System.lineSeparator()+System.lineSeparator()));
            inStream.close();

        } catch (IllegalStateException | IOException e) {
            e.printStackTrace();
        }
        return;
    }

    /**
     * 给日志上色!
     * @param msg 日志消息
     * @return html
     */
    private String setColorToMsg(String msg){
        String color = "";
        if(msg.toLowerCase().contains("error")){
            color = "#ff0000";
        }else if(msg.toLowerCase().contains("warn")){
            color = "#ff9900";
        }else if(msg.toLowerCase().contains("debug")){
            color = "#336600";
        }else if(msg.toLowerCase().contains("info")){
            color = "#0033cc";
        }else if(msg.contains("定时清除游离文件中（时间间隔5分钟）")){
            color = "#C1CDCD";
        }else if(msg.contains("Exception")){
            color = "#FFD700";
        }
        //对文本中含有的html代码进行转义
        msg = HtmlUtils.htmlEscape(msg);
        String html = "<p class='log_msg' style='color:"+color+"'>"+msg+"</p>";
        return html;
    }

    /**
     * 当连接关闭时被调用
     * @param session session
     * @param status 连接状态
     * @throws Exception 异常
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        log.info("Websocket:" + session.getId() + "已经关闭");
        Iterator<Map.Entry<Object, WebSocketSession>> it = userSocketSessionMap
                .entrySet().iterator();
        // 移除Socket会话
        log.info("======关闭连接======");
        while (it.hasNext()) {
            Map.Entry<Object, WebSocketSession> entry = it.next();
            if (entry.getValue().getId().equals(session.getId())) {
                userSocketSessionMap.remove(entry.getKey());
                log.warn("Socket会话已经移除:用户ID" + entry.getKey());
                break;
            }
        }
        this.close();
    }

    /**
     * 关闭程序和流
     */
    private void close(){
//        log.info("关闭ws的程序和流!");
//        try {
//            if(inputStream != null)
//                inputStream.close();
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//        if(process != null){
//            process.destroy();
//        }
    }

    /**
     * 传输错误时调用
     * @param session session
     * @param exception 异常
     * @throws Exception 异常
     */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        if (session.isOpen()) {
            session.close();
        }
        Iterator<Map.Entry<Object, WebSocketSession>> it = userSocketSessionMap
                .entrySet().iterator();
        log.info("======消息传输错误======");
        // 移除Socket会话
        while (it.hasNext()) {
            Map.Entry<Object, WebSocketSession> entry = it.next();
            if (entry.getValue().getId().equals(session.getId())) {
                userSocketSessionMap.remove(entry.getKey());
                log.error("Socket会话已经移除:用户ID" + entry.getKey());
                break;
            }
        }
        this.close();
    }

    /**
     * 给所有在线用户发送消息
     * @param message 发送消息
     */
    public void sendMessageToAllUsers(String message) {
        Iterator<Map.Entry<Object, WebSocketSession>> it = userSocketSessionMap
                .entrySet().iterator();
        log.info("======群发======");
        // 多线程群发
        while (it.hasNext()) {
            final Map.Entry<Object, WebSocketSession> entry = it.next();
            if (entry.getValue().isOpen()) {
                new Thread(new Runnable() {
                    public void run() {
                        try {
                            if (entry.getValue().isOpen()) {
                                entry.getValue().sendMessage(new TextMessage(message));
                            }
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                    }
                }).start();
            }
        }
    }


    /**
     * 给某个用户发送消息
     * @param userId 用户id
     * @param message 发送信息
     */
    public void sendMessageToUser(String userId,String message) throws IOException {
        WebSocketSession session = userSocketSessionMap.get(userId);
        log.info("======给某个用户发送消息======");
        if (session != null && session.isOpen()) {
            session.sendMessage(new TextMessage(message));
        }
    }

}

