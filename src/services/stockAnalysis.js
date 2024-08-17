const stockModel = require("../models/stockModel.js");
const logger = require("../../config/logconfig.js");
const moment = require('moment');
const _ = require("lodash");

exports.getHistoryTradeDataService = async (startDate, endDate) => {
    const result = await stockModel.getHistoryTradeData(startDate, endDate);
    return result;
}

/*
    # 规则：
        1、买入日，高开超1%不买（高开后回落至触发价的不算）
        2、买入日，收盘时实质下穿前日最低值、上影线比值大于1.03，第二日开盘卖出
        3、第二日未超过5%，收盘前卖出
        4、第二日超过5%，后续出现实质上下穿5日均线，收盘前卖出
    # 日常事项：
        1、删除前日设置的未被触发的条件单
        2、设置明日条件单
        3、开盘前卖出前日，收盘价实质下穿最低价、上影线太长的麦子
        4、收盘时卖出涨幅未到5%的麦子
*/

exports.volumeEnergyService = async (dataGrouped, delay) => {
    const seedStock = [];
    const startTimeAnalyse = Date.now();
    for (const [name, group] of Object.entries(dataGrouped)) {
        const evaluateInterval = group.slice(delay, delay + 200);
        const closePrice = evaluateInterval.map(item => item.close);
        const highPrice = evaluateInterval.map(item => item.high);
        const openPrice = evaluateInterval.map(item => item.open);
        const raiseFallRange = evaluateInterval.map(item => item.pct_chg);
        logger.info("group::",group);
        logger.info("group[delay]::",group[delay]);
        break
        analyseDate = moment(group[delay].trade_date).format('YYYY-MM-DD');

        const currentIndex = 5;
        if (raiseFallRange[currentIndex] / _.meanBy(_.map(raiseFallRange.slice(currentIndex + 1, currentIndex + 15), Math.abs)) < 2.5) {
            continue;
        }
        if (raiseFallRange[currentIndex] < Math.max(...raiseFallRange.slice(currentIndex, currentIndex + 15))) {
            continue;
        }
        if (closePrice[currentIndex] / Math.max(...closePrice.slice(currentIndex + 9, currentIndex + 20)) < 1.05) {
            continue;
        }
        if (raiseFallRange[currentIndex] < 8) {
            continue;
        }
        const raiseLimit = raiseFallRange.slice(0, currentIndex + 3).map(x => x > 9.9 ? 1 : 0);
        const raiseLimitMa3 = [];
        for (let i = 0; i < raiseLimit.length - 3; i++) {
            raiseLimitMa3.push(_.mean(raiseLimit.slice(i, i + 3)));
        }

        if (_.sumBy(raiseLimitMa3, x => x === 1) > 0) {
            continue;
        }
        // 调整期内不能有涨停
        if (Math.max(...raiseFallRange.slice(0, currentIndex - 2)) > 9.8) {
            continue;
        }

        const maxRaise = highPrice.slice(currentIndex - 3, currentIndex).map((high, idx) => {
            return (high / Math.max(openPrice[currentIndex - 3 + idx], closePrice[currentIndex - 3 + idx])) /
                (Math.max(openPrice[currentIndex - 3 + idx], closePrice[currentIndex - 3 + idx]) /
                    Math.min(openPrice[currentIndex - 3 + idx], closePrice[currentIndex - 3 + idx]));
        });

        const maxRaiseToOne = maxRaise.map(x => x >= 1.045 ? 1 : 0);
        if (_.sum(maxRaiseToOne) >= 1) {
            continue;
        }
        if (closePrice[0] <= 3) {
            continue;
        }
        if (closePrice[0] > 25) {
            continue;
        }
        // 当前MA21比前80日内的最小值不能大于15%
        const ma21 = [];
        for (let i = 0; i < 80; i++) {
            ma21.push(_.mean(closePrice.slice(i, i + 21)));
        }
        if (ma21[0] / Math.min(...ma21) > 1.15) {
            continue;
        }
        // 调整期内不能存在太大的长上影
        const eachKColumnScope = [];
        for (let i = 0; i < currentIndex - 1; i++) {
            eachKColumnScope.push((highPrice[i] / Math.max(openPrice[i], closePrice[i])) /
                (Math.max(openPrice[i], closePrice[i]) / Math.min(openPrice[i], closePrice[i])));
        }
        const eachKColumnScopeToOne = eachKColumnScope.map(x => x > 1.03 ? 1 : 0);
        if (_.sum(eachKColumnScopeToOne) > 0) {
            continue;
        }

        // 调整期内阴线长度不能太长
        const eachKColumnSolidLength = [];
        for (let i = 1; i < 6; i++) {
            eachKColumnSolidLength.push(openPrice[currentIndex - i] / closePrice[currentIndex - i] > 1.08 ? 1 : 0);
        }
        if (_.sum(eachKColumnSolidLength) > 0) {
            continue;
        }
        // 存在一字板
        if (_.sumBy(raiseFallRange.slice(currentIndex - 2, currentIndex + 1), (x, idx) => x > 9.8 && closePrice[currentIndex - 2 + idx] === openPrice[currentIndex - 2 + idx]) > 0) {
            continue;
        }

        const orginalRaiseFallRange = group.map(item => item.pct_chg);

        const oneMonthChange = delay - 23 < 0
            ? _.sum(orginalRaiseFallRange.slice(0, delay))
            : _.sum(orginalRaiseFallRange.slice(delay - 23, delay));
       // const deadline = moment(group[0].trade_date); // 假设 date 是列名
        const analyseDatePrice = closePrice[0];
        const purchasePrice = highPrice[0];

        seedStock.push([name, analyseDate, oneMonthChange, analyseDatePrice, purchasePrice,'volumnEnerge']);
    }
    const endTimeAnalyse = Date.now();
    //await stockModel.setAnalyseData(seedStock);
    logger.info(`${analyseDate} - 量能法分析耗时: ${endTimeAnalyse - startTimeAnalyse} ms`);

};

