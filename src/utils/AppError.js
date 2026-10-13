class AppError extends Error{
    constructor(status, code, messsage){
        super(messsage);
        this.status = status;
        this.code = code;
    }
}


module.exports = AppError;