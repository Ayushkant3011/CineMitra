const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../repositories/user.repository");
const { signAccessToken, signRefreshToken, setAuthCookies } = require("../utils/tokens");
const { user } = require("pg/lib/defaults");


const DUMMY_HASH = bcrypt.hashSync("Not-a-real-pass", 10);

const toPublicUser = (row) =>({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
});

const startSession = (res,row) =>{
    setAuthCookies(res, {
        accessToken: signAccessToken(row),
        refreshToken: signRefreshToken(row),
    });
};

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
            message: "User Added Successfully !!",
            data: { user: toPublicUser(row)}
        });
    }
    catch(err){
        if(err.code === "23505" && err.constraint === "users_email_key") 
            throw new AppError(409, "EMAIL TAKEN", "An Account with this email already exists");

        throw err;
    }
});

const login = asyncHandler(async(req, res) =>{
    try{
        const { email, password } = req.body;
    

        const row = await User.findByEmail(email);
        const hashToCheck = row ? row.password_hash : DUMMY_HASH;
        const passOk = await bcrypt.compare(password, hashToCheck);

        if(!row || !passOk) throw new AppError(401, "INVALID CREDENTIALS", "Invalid Email or Password");

        startSession(res, row);

        res.status(200).json({
            message: "Login Success !!",
            data: { user: toPublicUser(row) }
        });
    }
    catch(err){
        res.status(400).send("ERROR : " + err.message);
    }
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

module.exports = { signup, login, getProfile };