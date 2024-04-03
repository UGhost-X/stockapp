package com.stockbackend.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.*;

@Component
public class JDBCUtils {

    private DataSource dataSource;

    @Autowired
    public JDBCUtils(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    //Druid方法关闭连接实际是将连接放回连接池
    public void close(ResultSet resultSet, Statement statement, Connection connection) {
        try {
            if (resultSet != null) {
                resultSet.close();
            }
            if (statement != null) {
                statement.close();
            }
            if (connection != null) {
                connection.close();
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

}

