package com.stockbackend.utils;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.util.HtmlUtils;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class TailLogThread extends Thread {

    /**读取缓冲*/
    private BufferedReader reader;
    /**WebSocketSession*/
    private WebSocketSession session;
    /**消息队列*/
    private List<String> msgs = new ArrayList<>();
    /**cmd的文本编码*/
    private String encoding;

    public TailLogThread(InputStream in, WebSocketSession session) {
        this.reader = new BufferedReader(new InputStreamReader(in));
        this.session = session;

    }

    /**
     * 读取日志的方法
     */
    @Override
    public void run() {
        this.method1();
    }

    /**
     * 原始读取日志的方法
     */
    private void method1(){
        String line;
        try {
            if(session.isOpen()){
                //如果消息队列有数据，则先输出消息队列消息
                if(msgs.size()>0){
                    List<String> errMsgs = new ArrayList<>();
                    for(String msg:msgs){
                        try {
                            //输出消息队列消息
                            this.sendMsg(msg,session);
                        } catch (IOException e) {
                            //未发送的信息储存在错误消息队列中
                            System.err.println(e.getMessage());
                            errMsgs.add(msg);
                        }
                    }
                    //清空消息队列
                    msgs.clear();
                    //如果有错误的消息队列，储存给消息队列中
                    if(errMsgs.size()>0){
                        msgs = errMsgs;
                    }
                }
            }
            while((line = reader.readLine()) != null) {
                if(encoding==null||encoding==""){
                    encoding = this.StringEncoding(line);
                }
                //String text = new String(line.getBytes(encoding),"UTF-8");
                // 将实时日志通过WebSocket发送给客户端，给每一行添加一个HTML换行
                if(session.isOpen()){
                    this.sendMsg(line,session);
                }else{
                    msgs.add(line);
                }
            }
        } catch (IOException e) {
            System.err.println(e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 发送消息
     * @param msg
     * @param session
     * @throws IOException
     */
    private void sendMsg(String msg,WebSocketSession session) throws IOException {
        String str = msg;
        if(1==1){
            str = this.setColorToMsg(msg);
        }else{
            //文本域
            str = str + System.lineSeparator();
        }
        session.sendMessage(new TextMessage(str));
    }

    /**
     * 判断字符串编码
     * @param sb 字符串
     * @return 编码类型
     */
    private String StringEncoding(String sb){
        String backEncoding = "";
        String iso8859 = this.testEncoding(sb,"iso8859-1");
        String gbk = this.testEncoding(sb,"gbk");
        String utf8 = this.testEncoding(sb,"utf-8");
        if(iso8859.equals(sb.toString())){
            backEncoding = "iso8859";
        }else  if(gbk.equals(sb.toString())){
            backEncoding = "gbk";
        }else  if(utf8.equals(sb.toString())){
            backEncoding = "utf8";
        }
        return backEncoding;
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
     * 测试编码
     * @param sb 文本
     * @param encoding 编码
     * @return
     */
    private String testEncoding(String sb,String encoding){
        String tmpStrin = null;
        try {
            tmpStrin = new String(sb.toString().getBytes(encoding));
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return tmpStrin;
    }
}

