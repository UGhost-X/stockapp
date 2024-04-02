package com.stockbackend.configure;

import com.alibaba.druid.pool.DruidDataSource;
import com.stockbackend.component.DruidProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.SQLException;

@Configuration
public class DruidConfig {
    @Autowired
    public DruidProperties dataProperties;

    @Bean(name = "dataSource")
    public DataSource druidDataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setUsername(dataProperties.getUserName());
        dataSource.setPassword(dataProperties.getPassword());
        dataSource.setUrl(dataProperties.getUrl());
        return dataSource;
    }

}
