package com.stockbackend.component;

import com.stockbackend.utils.ToolsUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import javax.servlet.http.HttpSession;
import java.util.Map;

@Slf4j
public class WebSocketInterceptor_ShowLog implements HandshakeInterceptor {

    /**
     * 日志
     */
    /**
     * 握手前
     *
     * @param request    请求
     * @param response   响应
     * @param handler    ws握手
     * @param attributes 属性
     * @return 是否握手成功
     * @throws Exception 异常
     */
    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler,
                                   Map<String, Object> attributes) throws Exception {
        log.info("执行握手: " + handler + "map: " + attributes.values());
        if (request != null) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpSession session = servletRequest.getServletRequest().getSession();
            if (session != null) {
                String userId = (String) session.getAttribute("WEBSOCKET_SL_ID");
                if (userId != null) {
                    session.setAttribute("SESSION_SL_ID", userId);
                    attributes.put("WEBSOCKET_SL_ID", userId);
                } else {
                    session.setAttribute("SESSION_SL_ID", session.getId());
                    attributes.put("WEBSOCKET_SL_ID", session.getId());
                }
            }
        }
        return true;
    }

    /**
     * 将属性设置到session里
     *
     * @param session       session
     * @param attributes    Map
     * @param attributeName 待设置的属性名
     * @param attribute     待设置的属性
     */
    private void setAttributes(HttpSession session, Map<String, Object> attributes, String attributeName, String attribute) {
        if (ToolsUtil.isNotNull(attribute)) {
            String attributeNameUp = attributeName.toUpperCase();
            session.setAttribute("SESSION_" + attributeNameUp, attribute);
            attributes.put("WEBSOCKET_" + attributeNameUp, attribute);
        }
    }

    /**
     * 握手后
     *
     * @param request    请求
     * @param response   响应
     * @param handler    ws握手
     * @param exceptions 错误
     */
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler, Exception exceptions) {
        log.info("握手后: " + handler + "exceptions: " + exceptions);
    }

}


