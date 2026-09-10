const db = require("../config/db");


// ------------------------------------
// Find or create skills
// ------------------------------------

const findOrCreateSkills = (
    skillNames,
    callback
) => {

    if (
        !skillNames ||
        skillNames.length === 0
    ) {
        return callback(null, []);
    }


    const normalizedNames =
        [...new Set(
            skillNames.map(
                name => name.trim()
            )
        )];


    const placeholders =
        normalizedNames
            .map(() => "?")
            .join(",");


    const findSql = `
        SELECT skill_id, skill_name
        FROM skills
        WHERE skill_name IN (${placeholders})
    `;


    db.query(
        findSql,
        normalizedNames,
        (err, existingSkills) => {

            if (err) {
                return callback(err);
            }


            const existingNames =
                existingSkills.map(
                    skill => skill.skill_name
                );


            const newSkills =
                normalizedNames.filter(
                    name =>
                        !existingNames.includes(name)
                );


            // --------------------------------
            // Nothing new
            // --------------------------------

            if (newSkills.length === 0) {

                return callback(
                    null,
                    existingSkills
                );

            }


            // --------------------------------
            // Insert new skills
            // --------------------------------

            const values =
                newSkills.map(
                    name => [name, "Programming"]
                );


            const insertSql = `
                INSERT INTO skills
                    (skill_name, category)
                VALUES ?
            `;


            db.query(
                insertSql,
                [values],
                (err) => {

                    if (err) {
                        return callback(err);
                    }


                    // Get all again
                    db.query(
                        findSql,
                        normalizedNames,
                        (err, allSkills) => {

                            if (err) {
                                return callback(err);
                            }

                            callback(
                                null,
                                allSkills
                            );

                        }
                    );

                }
            );

        }
    );

};


module.exports = {
    findOrCreateSkills
};