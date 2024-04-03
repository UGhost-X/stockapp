package com.stockbackend.utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class DateUtils {
    public String formateDateString(String originDate) {
        LocalDate date = LocalDate.parse(originDate, DateTimeFormatter.ISO_DATE);

        // Format the date as a string in the desired format
        String formattedDate = date.format(DateTimeFormatter.BASIC_ISO_DATE);
        return formattedDate;
    }

}
