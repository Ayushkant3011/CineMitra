const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../repositories/user.repository");
const { signAccessToken, signRefreshToken, setAuthCookies } = require("../utils/tokens");

const toPublicUser = (row) =>({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
});

const signup = asyncHandler(async (req, res) =>{
    try{
        const {firstName, lastName, email, password} = req.body;

        // Hash Password
        const passwordHash = await bcrypt.hash(password, 10);
        
        let row;
        row = await User.createUser({ 
            firstName,
            lastName,
            email,
            passwordHash,
        });


        setAuthCookies(res, {
            accessToken: signAccessToken(row),
            refreshToken: signRefreshToken(row),
        });

        res.status(201).json({
            data: { user: toPublicUser(row)}
        });
    }
    catch(err){
        if(err.code === "23505") 
            throw new AppError(409, "EMAIL TAKEN", "An Account with this email already exists");

        throw err;
    }
});

module.exports = { signup };