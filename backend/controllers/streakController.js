const db = require("../config/db");

const getStreak = (req, res) => {

    const userId = req.user.user_id;

    const sql = `
        SELECT 
            DATE_FORMAT(login_date, '%Y-%m-%d') AS login_date
        FROM user_login_activity
        WHERE user_id = ?
        ORDER BY login_date DESC
    `;

    db.query(sql, [userId], (err, results) => {

        if (err) {
            console.error("GET STREAK ERROR:", err);

            return res.status(500).json({
                message: "Failed to get streak"
            });
        }

        if (results.length === 0) {

            return res.json({
                current_streak: 0,
                longest_streak: 0,
                logged_in_today: false
            });
        }

        const dates = results.map(
            row => row.login_date
        );

        // Today's date according to MySQL server
        const todaySql = `
            SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today
        `;

        db.query(todaySql, (todayErr, todayResult) => {

            if (todayErr) {
                console.error(todayErr);

                return res.status(500).json({
                    message: "Failed to get today's date"
                });
            }

            const today = todayResult[0].today;

            const loggedInToday =
                dates.includes(today);


            // -----------------------------
            // CURRENT STREAK
            // -----------------------------

            let currentStreak = 0;

            let checkDate = new Date(
                today + "T00:00:00Z"
            );

            const firstDate = dates[0];

            const yesterday = new Date(checkDate);

            yesterday.setUTCDate(
                yesterday.getUTCDate() - 1
            );

            const yesterdayString =
                yesterday.toISOString().split("T")[0];


            if (
                firstDate === today ||
                firstDate === yesterdayString
            ) {

                if (firstDate === today) {
                    checkDate = new Date(
                        today + "T00:00:00Z"
                    );
                } else {
                    checkDate = yesterday;
                }

                for (const date of dates) {

                    const expectedDate =
                        checkDate
                            .toISOString()
                            .split("T")[0];

                    if (date === expectedDate) {

                        currentStreak++;

                        checkDate.setUTCDate(
                            checkDate.getUTCDate() - 1
                        );

                    } else {
                        break;
                    }
                }
            }


            // -----------------------------
            // LONGEST STREAK
            // -----------------------------

            let longestStreak = 0;
            let streak = 0;
            let previousDate = null;

            for (const date of dates) {

                if (!previousDate) {

                    streak = 1;

                } else {

                    const currentDate =
                        new Date(
                            date + "T00:00:00Z"
                        );

                    const prevDate =
                        new Date(
                            previousDate + "T00:00:00Z"
                        );

                    const difference =
                        (
                            prevDate - currentDate
                        ) /
                        (1000 * 60 * 60 * 24);

                    if (difference === 1) {
                        streak++;
                    } else {
                        streak = 1;
                    }
                }

                if (streak > longestStreak) {
                    longestStreak = streak;
                }

                previousDate = date;
            }


            // -----------------------------
            // RESPONSE
            // -----------------------------

            res.json({
                current_streak: currentStreak,
                longest_streak: longestStreak,
                logged_in_today: loggedInToday
            });

        });

    });
};

module.exports = {
    getStreak
};