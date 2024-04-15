package com.stockbackend.serivce;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;

@Component
@Slf4j
@ServerEndpoint("/api/websocket/log") // 接口路径 ws://localhost:8080/api/webSocket/sid;
public class WebSocketLogService {
    private Session session;
    private final String logFormat = "=============== %s ======================";

    /**
     * 连接建立成功调用的方法
     */
    @OnOpen
    public void onOpen(Session session) {
        this.session = session;
        log.info(String.format(logFormat, "开始监听"));
        log.info(String.format(logFormat, "开启session: " + this.session));
    }

    /**
     * 连接关闭调用的方法
     */
    @OnClose
    public void onClose() {
        log.info(String.format(logFormat, "WebSocket连接已关闭"));
    }

    /**
     * 收到客户端消息后调用的方法
     *
     * @ Param message 客户端发送过来的消息
     */
    @OnMessage
    public void onMessage(String message, Session session) throws IOException {
        log.info(String.format(logFormat, "收到客户端消息::" + message));
        sendMessage("respect info:::" + message);
    }

    /**
     * 出错时调用的方法
     * @ Param session
     * @ Param error
     */
    @OnError
    public void onError(Session session, Throwable error) {
        log.error("发生错误");
        error.printStackTrace();
    }

    /**
     * 实现服务器主动推送
     */
    public void sendMessage(String message) throws IOException {
        this.session.getBasicRemote().sendText(message);
    }
}
