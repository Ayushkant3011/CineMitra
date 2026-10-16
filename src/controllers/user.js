const asyncHandler = require("../utils/asyncHandler");


const toPublicUser = (row) =>({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
});


const getProfile = asyncHandler( async(req, res) =>{
    try{
        const user = req.user;
        res.status(200).json({
            data: { user: toPublicUser(user)}
        });
    }
    catch(err){
        res.status(400).send("ERROR : " + err.message);
    }
});


module.exports = { getProfile };