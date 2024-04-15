package com.stockbackend.component;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

/**
 * <p>Title: websocket配置类 - WebSocketConfig_ShowLog</p>
 *
 * <p>Description:websocket日志显示的配置信息</p>
 *
 * <p>Copyright: Copyright Faker(c) 2018</p>
 *
 * <p>Company: 无</p>
 *
 * @author Anlinxi
 * @version 1.0
 */
@Configuration
//这个标注可以不加，如果有加，要extends WebMvcConfigurerAdapter
@EnableWebMvc
@EnableWebSocket
public class WebSocketConfig_ShowLog extends WebMvcConfigurerAdapter implements WebSocketConfigurer {

    /**
     * 注册websocket的信息
     *
     * @param registry registry
     */
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        //设置websocket的地址,注册Handler,注册Interceptor
        registry.addHandler(SocketHandler(), "/ws_showLog.json").setAllowedOrigins("*").addInterceptors(new WebSocketInterceptor_ShowLog());
        //注册SockJS，提供SockJS支持(主要是兼容ie8)
        registry.addHandler(SocketHandler(), "/sockjs/ws_showLog.ws")
                //允许跨域
                .setAllowedOrigins("*")
                //注册Interceptor
                .addInterceptors(new WebSocketInterceptor_ShowLog())
                //支持sockjs协议
                .withSockJS();
    }

    @Bean
    public org.springframework.web.socket.WebSocketHandler SocketHandler() {
        return new com.stockbackend.component.WebSocketHandler_ShowLog();
    }


    /**
     * 配置webSocket引擎
     * 用于tomcat 可以不配置
     *
     * @return Bean
     */
    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(8192);
        container.setMaxBinaryMessageBufferSize(8192);
        return container;
    }

}


