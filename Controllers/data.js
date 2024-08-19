const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE,
})

exports.select = (req, res) => {
    const todate = req.body.todates
    const fromdate = req.body.fromdates
    const sql = `SELECT
    DATE_FORMAT(STR_TO_DATE(date, '%m/%d/%Y'), '%d.%b') AS date,
    DATE_FORMAT(STR_TO_DATE(time, '%H:%i:%s'), '%l %p') AS time,
    COUNT(*) AS count
FROM
    DBSYuu_MCA_Response
WHERE
    status = 3
    AND STR_TO_DATE(date, '%m/%d/%Y') BETWEEN STR_TO_DATE('${fromdate}', '%m/%d/%Y') AND STR_TO_DATE('${todate}', '%m/%d/%Y')
GROUP BY
    date,DATE_FORMAT(STR_TO_DATE(time, '%H:%i:%s'), '%l %p')  
ORDER BY
    STR_TO_DATE(date, '%m/%d/%Y') ASC,
    TIME_TO_SEC(STR_TO_DATE(time, '%H:%i:%s')) ASC`;
    
    const sql2 = `-- Count by status
-- Query to get counts and descriptions for each status and a total row
SELECT
    CASE
        WHEN status IS NULL THEN 'Click Through'
        WHEN status = 1 THEN 'Terminated'
        WHEN status = 2 THEN 'Overquota'
        WHEN status = 3 THEN 'Qualified'
        WHEN status = 4 THEN 'Partial'
        WHEN status = 5 THEN 'Excluded'
        ELSE 'Click Through' -- Default case if no match
    END AS title,
    COUNT(*) AS Count,
    CASE
        WHEN status = 1 THEN 'Participants who were terminated'
        WHEN status = 2 THEN 'Participants terminated due to quota logic'
        WHEN status = 3 THEN 'Participants who qualified and completed the survey'
        WHEN status = 4 THEN 'Participants who dropped out of the survey'
        WHEN status = 5 THEN 'Participants who were excluded from the survey'
        ELSE 'Participants who opened the first page of the survey' -- Default tooltip
    END AS tooltip,
    CASE
        WHEN status IS NULL THEN 1 -- Click Through should be last
        WHEN status = 1 THEN 3
        WHEN status = 2 THEN 4
        WHEN status = 3 THEN 5
        WHEN status = 4 THEN 2
        WHEN status = 5 THEN 6
        ELSE 7 -- Click Through should be second to last
    END AS sort_order
FROM
    DBSYuu_MCA_Response
WHERE
    STR_TO_DATE(date, '%m/%d/%Y') BETWEEN STR_TO_DATE('${fromdate}', '%m/%d/%Y') AND STR_TO_DATE('${todate}', '%m/%d/%Y')
GROUP BY
    status WITH ROLLUP

UNION ALL

-- Query to calculate Participation Rate
SELECT
    'Participation Rate' AS title,
    CONCAT(
        ROUND(
            (SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) +  -- Qualified
             SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END)) / 
            NULLIF(
                COUNT(*) - 
                SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) -  -- Partial
                SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END),  -- Excluded
                0
            ) * 100
        ), '%'
    ) AS Count,
    'Calculation: (Qualified + Overquota) / (Total - Partial - Excluded)' AS tooltip,
    8 AS sort_order -- Ensure Participation Rate is last
FROM
    DBSYuu_MCA_Response
WHERE
    STR_TO_DATE(date, '%m/%d/%Y') BETWEEN STR_TO_DATE('${fromdate}', '%m/%d/%Y') AND STR_TO_DATE('${todate}', '%m/%d/%Y') ORDER BY sort_order`;    

  const sql3=`SELECT vterm as title,count(vterm) as value,vterm_sort FROM DBSYuu_MCA_Response where vterm!='' AND STR_TO_DATE(date, '%m/%d/%Y') BETWEEN STR_TO_DATE('${fromdate}', '%m/%d/%Y') AND STR_TO_DATE('${todate}', '%m/%d/%Y') GROUP by vterm  ORDER BY vterm_sort ASC`;  

  db.query(sql, (err, results) => {
    if (err) {
        return res.status(500).json({ error: err.message });
    }

    let mainData = [];
    let drilldownData = {};

    results.forEach(row => {
        // Aggregate counts by date for the main chart
        if (!mainData.find(item => item.name === row.date)) {
            mainData.push({
                name: row.date,
                y: 0, // Initialize with 0, we'll sum it up below
                drilldown: row.date
            });
        }

        // Add count to the corresponding date
        mainData.find(item => item.name === row.date).y += row.count;

        // Aggregate counts by time for the drilldown chart
        if (!drilldownData[row.date]) {
            drilldownData[row.date] = [];
        }

        drilldownData[row.date].push([row.time, row.count]);
    });

    // Format drilldownData for Highcharts
    let formattedDrilldownData = Object.keys(drilldownData).map(date => ({
        id: date,
        data: drilldownData[date],
        color: '#5a748c',
    }));
    db.query(sql2, (err, result2) => {
            if (err) {
                console.log(err);
            }
            else{
                const formattedResult = result2.map(row => {
                    return {
                        title: row.title,
                        tooltip: row.tooltip,
                        Count:  parseInt(row.Count.toString()) 
                    };
                });
    db.query(sql3, (err, result3) => {
                    if (err) {
                        console.log(err);
                    }

    if (result3.length === 0) {
        // You might want to send a response or update the UI accordingly
        res.json({ message: 'No data found.' });
        return;
    }
                    res.json({
                    mainData: mainData,
                    drilldownData: formattedDrilldownData,
                    data2:formattedResult,
                    data3:result3,
                });      
                });
            }
    });
});

};