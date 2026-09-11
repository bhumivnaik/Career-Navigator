const axios = require("axios");
const cheerio = require("cheerio");

const db = require("../config/db");

//Add
const addCourse = (req, res) => {
    const userId = req.user.user_id;
    const { course_name, provider, description, completion_date, certificate_url, skill_ids } = req.body;

    const addsql = `insert into user_courses (user_id, course_name, provider, description, completion_date, certificate_url)
    values (?,?,?,?,?,?)`;

    db.query(addsql, [userId, course_name, provider, description, completion_date, certificate_url],
        async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to add course" });
            }

            const courseId = result.insertId;
            if (!skill_ids || skill_ids.length === 0) {
                return res.status(201).json({
                    message: "Course added successfully",
                    course_id: courseId
                });
            }

            const courseskillsql = `insert into course_skills (course_id, skill_id) values ?`;
            const skillValues = skill_ids.map(skillId =>
                [courseId, skillId]
            );

            db.query(courseskillsql, [skillValues], (err) => {
                if (err) {
                    return res.status(500).json({ message: "Course added but skills could not be added" });
                }

                res.status(201).json({
                    message: "Course and skills added successfully",
                    course_id: courseId
                });
            }
            );
        }
    )
}

//Get
const getCourse = (req, res) => {
    const userId = req.user.user_id;

    const getsql = `select * from user_courses where user_id = ?`;

    db.query(getsql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to get course" });
        }
        res.json(result);
    });

}

//Delete
const delCourse = (req, res) => {
    const userId = req.user.user_id;
    const courseId = req.params.id;

    const delsql = `delete from user_courses where course_id = ? and user_id = ?`;

    db.query(delsql, [courseId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to delete Course" });
        }
        res.json({ message: "Course deleted successfully" });
    });
}

//Update
const putCourse = (req, res) => {
    const userId = req.user.user_id;
    const courseId = req.params.id;

    const { course_name, provider, description, completion_date, certificate_url, skill_ids } = req.body;

    const putsql = `update user_courses set course_name= ?, provider= ?, description= ?, completion_date= ?, certificate_url= ? where course_id = ? and user_id = ?`;

    db.query(putsql, [course_name, provider, description, completion_date, certificate_url, courseId, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Failed to update course" });
        }

        const putSkillsSql = `DELETE FROM course_skills WHERE course_id = ?`;
        db.query(putSkillsSql, [courseId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to update experience" });
            }

            if (skill_ids && skill_ids.length > 0) {
                const values = skill_ids.map(skillId => [courseId, skillId]);
                const addSkillsql = `Insert into course_skills (course_id, skill_id) values ?`;
                db.query(addSkillsql, [values], (err, result) => {
                    if (err) {
                        return res.status(500).json({ message: "Failed to update course skills" });
                    }
                    res.json({ message: "course updated successfully" });
                });
            } else {
                res.json({ message: "update course successfully" });
            }
        })
    });
};




// ===============================
// IMPORT CREDLY CREDENTIAL
// ===============================

const importCredlyCredential = async (req, res) => {

    try {

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                message: "Credly URL is required"
            });
        }


        // Check that it is actually a Credly URL
        let parsedUrl;

        try {
            parsedUrl = new URL(url);
        } catch (error) {
            return res.status(400).json({
                message: "Invalid URL"
            });
        }


        if (
            parsedUrl.hostname !== "www.credly.com" &&
            parsedUrl.hostname !== "credly.com"
        ) {
            return res.status(400).json({
                message: "Please provide a valid Credly URL"
            });
        }


        // Fetch public Credly page
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
            }
        });


        const html = response.data;

        const $ = cheerio.load(html);


        let credential = {
            name: "",
            issuer: "",
            description: "",
            issuedDate: "",
            expiryDate: "",
            credentialType: "",
            level: "",
            imageUrl: "",
            skills: []
        };


        // =====================================
        // 1. Try JSON-LD structured data
        // =====================================

        $('script[type="application/ld+json"]').each(
            (index, element) => {

                try {

                    const jsonText = $(element).html();

                    if (!jsonText) {
                        return;
                    }

                    const data = JSON.parse(jsonText);

                    const objects = Array.isArray(data)
                        ? data
                        : [data];


                    for (const item of objects) {

                        if (
                            !credential.name &&
                            item.name
                        ) {
                            credential.name = item.name;
                        }

                        if (
                            !credential.description &&
                            item.description
                        ) {
                            credential.description =
                                item.description;
                        }

                        if (
                            !credential.issuer &&
                            item.issuer
                        ) {

                            if (
                                typeof item.issuer === "string"
                            ) {
                                credential.issuer =
                                    item.issuer;
                            } else {
                                credential.issuer =
                                    item.issuer.name || "";
                            }
                        }

                    }

                } catch (error) {
                    // Ignore invalid JSON-LD
                }

            }
        );


        // =====================================
        // 2. Meta tags
        // =====================================

        const metaTitle =
            $('meta[property="og:title"]').attr("content");

        const metaDescription =
            $('meta[property="og:description"]').attr("content");

        const metaImage =
            $('meta[property="og:image"]').attr("content");


        if (!credential.name && metaTitle) {
            credential.name = metaTitle;
        }

        if (
            !credential.description &&
            metaDescription
        ) {
            credential.description =
                metaDescription;
        }

        if (metaImage) {
            credential.imageUrl = metaImage;
        }


        // =====================================
        // 3. Page title fallback
        // =====================================

        if (!credential.name) {

            credential.name =
                $("title").first().text().trim();

        }


        // =====================================
        // 4. Extract visible text
        // =====================================

        const pageText = $("body")
            .text()
            .replace(/\s+/g, " ")
            .trim();


        // =====================================
        // 5. Issuer
        // =====================================

        if (!credential.issuer) {

            const issuedByMatch =
                pageText.match(
                    /Issued by\s+(.+?)(?=\s+(Skills|Type|Level|Time|Cost|Earning Criteria)|$)/i
                );

            if (issuedByMatch) {
                credential.issuer =
                    issuedByMatch[1].trim();
            }
        }


        // =====================================
        // 6. Type
        // =====================================

        const typeMatch =
            pageText.match(
                /Type\s+([A-Za-z ]+?)(?=\s+(Level|Time|Cost|Skills|Earning Criteria)|$)/i
            );

        if (typeMatch) {
            credential.credentialType =
                typeMatch[1].trim();
        }


        // =====================================
        // 7. Level
        // =====================================

        const levelMatch =
            pageText.match(
                /Level\s+([A-Za-z ]+?)(?=\s+(Time|Cost|Skills|Earning Criteria)|$)/i
            );

        if (levelMatch) {
            credential.level =
                levelMatch[1].trim();
        }


        // =====================================
        // 8. Find issued date
        // =====================================

        const issuedMatch =
            pageText.match(
                /Issued\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
            );

        if (issuedMatch) {
            credential.issuedDate =
                issuedMatch[1];
        }


        // =====================================
        // 9. Find expiry date
        // =====================================

        const expiryMatch =
            pageText.match(
                /Expires\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
            );

        if (expiryMatch) {
            credential.expiryDate =
                expiryMatch[1];
        }


        // =====================================
        // 10. Extract skills
        // =====================================

        const skills = [];

        $("a").each((index, element) => {

            const text =
                $(element)
                    .text()
                    .trim();

            if (!text) {
                return;
            }

            const href =
                $(element).attr("href") || "";

            if (
                href.includes("/skills/") &&
                !skills.includes(text)
            ) {
                skills.push(text);
            }

        });

        credential.skills = skills;


        // =====================================
        // Check if we actually found something
        // =====================================

        if (!credential.name) {

            return res.status(422).json({
                message:
                    "Could not extract credential information from this Credly page. Make sure the badge is public."
            });

        }


        // =====================================
        // Return extracted data
        // =====================================

        res.json({
            success: true,
            credential: {
                ...credential,
                credentialUrl: url
            }
        });


    } catch (error) {

        console.error(
            "CREDLY IMPORT ERROR:",
            error.message
        );


        if (
            error.response &&
            error.response.status === 404
        ) {
            return res.status(404).json({
                message:
                    "Credly credential not found."
            });
        }


        return res.status(500).json({
            message:
                "Unable to read the Credly credential. Make sure the badge is public and the URL is correct."
        });

    }

};

module.exports = { addCourse, getCourse, delCourse, putCourse, importCredlyCredential };