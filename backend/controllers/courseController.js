const db = require("../config/db");

// Add
const addCourse = (req, res) => {
    const userId = req.user.user_id;

    const {
        course_name,
        provider,
        description,
        completion_date,
        certificate_url,
        skill_ids
    } = req.body;

    const addSql = `
        INSERT INTO user_courses
        (user_id, course_name, provider, description, completion_date, certificate_url)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        addSql,
        [
            userId,
            course_name,
            provider,
            description,
            completion_date,
            certificate_url
        ],
        (err, result) => {
            if (err) {
                console.error("ADD COURSE ERROR:", err);
                return res.status(500).json({
                    message: "Failed to add course"
                });
            }

            const courseId = result.insertId;

            if (!Array.isArray(skill_ids) || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Course added successfully",
                    course_id: courseId
                });
            }

            const skillValues = skill_ids.map(skillId => [
                courseId,
                skillId
            ]);

            const courseSkillSql = `
                INSERT INTO course_skills
                (course_id, skill_id)
                VALUES ?
            `;

            db.query(courseSkillSql, [skillValues], (err) => {
                if (err) {
                    console.error("ADD COURSE SKILLS ERROR:", err);
                    return res.status(500).json({
                        message: "Course added but skills could not be added"
                    });
                }

                const sourceValues = skill_ids.map(skillId => [
                    userId,
                    skillId,
                    "course",
                    courseId
                ]);

                const sourceSql = `
                    INSERT INTO user_skill_sources
                    (user_id, skill_id, source_type, source_record_id)
                    VALUES ?
                `;

                db.query(sourceSql, [sourceValues], (err) => {
                    if (err) {
                        console.error("ADD COURSE SOURCES ERROR:", err);
                        return res.status(500).json({
                            message: "Course added but skill sources could not be added"
                        });
                    }

                    const userSkillValues = skill_ids.map(skillId => [
                        userId,
                        skillId
                    ]);

                    const userSkillSql = `
                        INSERT IGNORE INTO user_skills
                        (user_id, skill_id)
                        VALUES ?
                    `;

                    db.query(userSkillSql, [userSkillValues], (err) => {
                        if (err) {
                            console.error("ADD USER SKILLS ERROR:", err);
                            return res.status(500).json({
                                message: "Course added but user skills could not be added"
                            });
                        }

                        res.status(201).json({
                            message: "Course and skills added successfully",
                            course_id: courseId
                        });
                    });
                });
            });
        }
    );
};


// Get
const getCourse = (req, res) => {
    const userId = req.user.user_id;

    const getSql = `
        SELECT
            uc.*,
            COALESCE(
                GROUP_CONCAT(cs.skill_id),
                ''
            ) AS skill_ids
        FROM user_courses uc
        LEFT JOIN course_skills cs
            ON uc.course_id = cs.course_id
        WHERE uc.user_id = ?
        GROUP BY uc.course_id
    `;

    db.query(getSql, [userId], (err, result) => {
        if (err) {
            console.error("GET COURSE ERROR:", err);
            return res.status(500).json({
                message: "Failed to get course"
            });
        }

        const formattedResult = result.map(item => ({
            ...item,
            skill_ids: item.skill_ids
                ? item.skill_ids.split(",").map(Number)
                : []
        }));

        res.json(formattedResult);
    });
};


// Delete
const delCourse = (req, res) => {
    const userId = req.user.user_id;
    const courseId = req.params.id;

    // First find the skills connected to this course
    const getSkillsSql = `
        SELECT skill_id
        FROM course_skills
        WHERE course_id = ?
    `;

    db.query(getSkillsSql, [courseId], (err, oldSkills) => {
        if (err) {
            console.error("GET OLD COURSE SKILLS ERROR:", err);
            return res.status(500).json({
                message: "Failed to delete course"
            });
        }

        const oldSkillIds = oldSkills.map(row => row.skill_id);

        // Delete source records
        const deleteSourcesSql = `
            DELETE FROM user_skill_sources
            WHERE user_id = ?
            AND source_type = 'course'
            AND source_record_id = ?
        `;

        db.query(
            deleteSourcesSql,
            [userId, courseId],
            (err) => {
                if (err) {
                    console.error("DELETE COURSE SOURCES ERROR:", err);
                    return res.status(500).json({
                        message: "Failed to delete course skill sources"
                    });
                }

                // Delete course
                const deleteCourseSql = `
                    DELETE FROM user_courses
                    WHERE course_id = ?
                    AND user_id = ?
                `;

                db.query(
                    deleteCourseSql,
                    [courseId, userId],
                    (err) => {
                        if (err) {
                            console.error("DELETE COURSE ERROR:", err);
                            return res.status(500).json({
                                message: "Failed to delete Course"
                            });
                        }

                        // Remove user_skills only if no other source exists
                        if (oldSkillIds.length === 0) {
                            return res.json({
                                message: "Course deleted successfully"
                            });
                        }

                        const cleanupSql = `
                            DELETE FROM user_skills
                            WHERE user_id = ?
                            AND skill_id IN (?)
                            AND NOT EXISTS (
                                SELECT 1
                                FROM user_skill_sources
                                WHERE user_skill_sources.user_id = ?
                                AND user_skill_sources.skill_id = user_skills.skill_id
                            )
                        `;

                        db.query(
                            cleanupSql,
                            [userId, oldSkillIds, userId],
                            (err) => {
                                if (err) {
                                    console.error(
                                        "CLEANUP COURSE SKILLS ERROR:",
                                        err
                                    );
                                    return res.status(500).json({
                                        message: "Course deleted but skill cleanup failed"
                                    });
                                }

                                res.json({
                                    message: "Course deleted successfully"
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};


// Update
const putCourse = (req, res) => {
    const userId = req.user.user_id;
    const courseId = req.params.id;

    const {
        course_name,
        provider,
        description,
        completion_date,
        certificate_url,
        skill_ids
    } = req.body;

    // First get the old skills
    const getOldSkillsSql = `
        SELECT skill_id
        FROM course_skills
        WHERE course_id = ?
    `;

    db.query(getOldSkillsSql, [courseId], (err, oldSkills) => {
        if (err) {
            console.error("GET OLD COURSE SKILLS ERROR:", err);
            return res.status(500).json({
                message: "Failed to update course"
            });
        }

        const oldSkillIds = oldSkills.map(row => row.skill_id);

        // Update course details
        const updateSql = `
            UPDATE user_courses
            SET
                course_name = ?,
                provider = ?,
                description = ?,
                completion_date = ?,
                certificate_url = ?
            WHERE course_id = ?
            AND user_id = ?
        `;

        db.query(
            updateSql,
            [
                course_name,
                provider,
                description,
                completion_date,
                certificate_url,
                courseId,
                userId
            ],
            (err) => {
                if (err) {
                    console.error("UPDATE COURSE ERROR:", err);
                    return res.status(500).json({
                        message: "Failed to update course"
                    });
                }

                // Remove old course skills
                const deleteCourseSkillsSql = `
                    DELETE FROM course_skills
                    WHERE course_id = ?
                `;

                db.query(
                    deleteCourseSkillsSql,
                    [courseId],
                    (err) => {
                        if (err) {
                            console.error(
                                "DELETE OLD COURSE SKILLS ERROR:",
                                err
                            );
                            return res.status(500).json({
                                message: "Failed to update course skills"
                            });
                        }

                        // Remove old source records
                        const deleteSourcesSql = `
                            DELETE FROM user_skill_sources
                            WHERE user_id = ?
                            AND source_type = 'course'
                            AND source_record_id = ?
                        `;

                        db.query(
                            deleteSourcesSql,
                            [userId, courseId],
                            (err) => {
                                if (err) {
                                    console.error(
                                        "DELETE OLD COURSE SOURCES ERROR:",
                                        err
                                    );
                                    return res.status(500).json({
                                        message: "Failed to update course sources"
                                    });
                                }

                                // Clean old skills that no longer have any source
                                const cleanupOldSkills = () => {
                                    if (oldSkillIds.length === 0) {
                                        return addNewSkills();
                                    }

                                    const cleanupSql = `
                                        DELETE FROM user_skills
                                        WHERE user_id = ?
                                        AND skill_id IN (?)
                                        AND NOT EXISTS (
                                            SELECT 1
                                            FROM user_skill_sources
                                            WHERE user_skill_sources.user_id = ?
                                            AND user_skill_sources.skill_id = user_skills.skill_id
                                        )
                                    `;

                                    db.query(
                                        cleanupSql,
                                        [userId, oldSkillIds, userId],
                                        (err) => {
                                            if (err) {
                                                console.error(
                                                    "CLEANUP OLD COURSE SKILLS ERROR:",
                                                    err
                                                );
                                                return res.status(500).json({
                                                    message: "Failed to clean old course skills"
                                                });
                                            }

                                            addNewSkills();
                                        }
                                    );
                                };

                                // Add new skills
                                const addNewSkills = () => {
                                    if (
                                        !Array.isArray(skill_ids) ||
                                        skill_ids.length === 0
                                    ) {
                                        return res.json({
                                            message: "Course updated successfully"
                                        });
                                    }

                                    const skillValues = skill_ids.map(
                                        skillId => [courseId, skillId]
                                    );

                                    const insertCourseSkillsSql = `
                                        INSERT INTO course_skills
                                        (course_id, skill_id)
                                        VALUES ?
                                    `;

                                    db.query(
                                        insertCourseSkillsSql,
                                        [skillValues],
                                        (err) => {
                                            if (err) {
                                                console.error(
                                                    "ADD NEW COURSE SKILLS ERROR:",
                                                    err
                                                );
                                                return res.status(500).json({
                                                    message: "Failed to add new course skills"
                                                });
                                            }

                                            const sourceValues =
                                                skill_ids.map(skillId => [
                                                    userId,
                                                    skillId,
                                                    "course",
                                                    courseId
                                                ]);

                                            const insertSourcesSql = `
                                                INSERT INTO user_skill_sources
                                                (user_id, skill_id, source_type, source_record_id)
                                                VALUES ?
                                            `;

                                            db.query(
                                                insertSourcesSql,
                                                [sourceValues],
                                                (err) => {
                                                    if (err) {
                                                        console.error(
                                                            "ADD NEW COURSE SOURCES ERROR:",
                                                            err
                                                        );
                                                        return res.status(500).json({
                                                            message: "Failed to add new course sources"
                                                        });
                                                    }

                                                    const userSkillValues =
                                                        skill_ids.map(
                                                            skillId => [
                                                                userId,
                                                                skillId
                                                            ]
                                                        );

                                                    const insertUserSkillsSql = `
                                                        INSERT IGNORE INTO user_skills
                                                        (user_id, skill_id)
                                                        VALUES ?
                                                    `;

                                                    db.query(
                                                        insertUserSkillsSql,
                                                        [userSkillValues],
                                                        (err) => {
                                                            if (err) {
                                                                console.error(
                                                                    "ADD USER SKILLS ERROR:",
                                                                    err
                                                                );
                                                                return res.status(500).json({
                                                                    message: "Failed to update user skills"
                                                                });
                                                            }

                                                            res.json({
                                                                message: "Course updated successfully"
                                                            });
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                };

                                cleanupOldSkills();
                            }
                        );
                    }
                );
            }
        );
    });
};


module.exports = {
    addCourse,
    getCourse,
    delCourse,
    putCourse
};