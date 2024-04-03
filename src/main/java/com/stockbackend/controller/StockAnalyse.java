package com.stockbackend.controller;

import com.stockbackend.utils.JDBCUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@RestController
@RequestMapping("/hello")
public class StockAnalyse {
    @Autowired
    public JDBCUtils jdbcUtils;

    @RequestMapping("/")
    public String test() throws SQLException {
        String sql = "select id from HistoryRecord";
        String id = "";
        try (Connection connection = jdbcUtils.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery();) {
            if (resultSet.next()) {
                id = resultSet.getString("id");
            }
        }
        return id;
    }
}
