package com.stockbackend.utils;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
@Component
public class DateUtils {
    //
    public String formatDateString(String originDate, String format) {
        LocalDate date = LocalDate.parse(originDate, DateTimeFormatter.ISO_DATE);
        String formattedDate = date.format(DateTimeFormatter.ofPattern(format));
        return formattedDate;
    }

}
