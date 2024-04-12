package com.stockbackend.utils;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@SpringBootTest
public class DateUtilsTest {
    @Test
    public String formatDateString(String originDate, String format) {
        LocalDate date = LocalDate.parse(originDate, DateTimeFormatter.ISO_DATE);
        String formattedDate = date.format(DateTimeFormatter.ofPattern(format));
        return formattedDate;
    }

    @Test
    public void testFormateDateString(){
        String dateString = formatDateString("2023-03-04","yyyyMMdd");
        System.out.println(dateString);
    }
}
