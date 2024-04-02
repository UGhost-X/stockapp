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
    public String  test() throws SQLException {
        Connection connection = jdbcUtils.getConnection();
        String sql = "select id from HistoryRecord";
        PreparedStatement statement = connection.prepareStatement(sql);
        ResultSet resultSet = statement.executeQuery();
        String id = "";
        if (resultSet.next()) {
            id = resultSet.getString("id");
        }
        return id;
    }
}
