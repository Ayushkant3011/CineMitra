const AppError = require("../utils/AppError");
const { withTransaction } = require("../utils/transaction");
const Show = require("../repositories/show.repository");

const createShow = (input) =>
    withTransaction(async (db) => {
        if (!(await Show.movieExists(db, input.movieId))) {
        throw new AppError(404, "MOVIE_NOT_FOUND", "Movie with given id does not exist");
        }
        if (!(await Show.screenExists(db, input.screenId))) {
        throw new AppError(404, "SCREEN_NOT_FOUND", "Screen with given id does not exist");
        }

        const categories = await Show.seatCategoriesForScreen(db, input.screenId);
        if (categories.length === 0) {
        throw new AppError(409, "SCREEN_HAS_NO_SEATS", "This screen has no seats yet");
        }

        const priced = new Set(input.prices.map((p) => p.category));
        const missing = categories.filter((c) => !priced.has(c));
        if (missing.length > 0) {
        throw new AppError(400, "MISSING_PRICES", `Missing price for: ${missing.join(", ")}`);
        }

        let show;
        try {
        show = await Show.insertShow(db, input);
        } catch (err) {
        if (err.code === "23P01") {
            throw new AppError(409, "SHOW_OVERLAP", "This screen already has a show during that time");
        }
        throw err;
        }

        await Show.insertPrices(db, show.id, input.prices);
        return { show, prices: input.prices };
    });



const updateShow = (id, changes) =>
    withTransaction(async (db) => {
        const current = await Show.lockShowById(db, id);
        if (!current) {
        throw new AppError(404, "SHOW_NOT_FOUND", "Show not found");
        }
        if (current.status !== "scheduled") {
        throw new AppError(409, "SHOW_NOT_EDITABLE", `A ${current.status} show cannot be edited`);
        }
        if (await Show.hasActiveBookings(db, id)) {
        throw new AppError(
            409,
            "SHOW_HAS_BOOKINGS",
            "This show has active bookings and cannot be changed until cancellation and refunds are supported"
        );
        }

        const startTime = changes.startTime ?? current.start_time;
        const endTime = changes.endTime ?? current.end_time;
        if (new Date(endTime) <= new Date(startTime)) {
        throw new AppError(400, "VALIDATION_ERROR", "endTime: must be after startTime");
        }

        let updated;
        try {
        updated = await Show.updateShow(db, id, { startTime, endTime, status: changes.status });
        } catch (err) {
        if (err.code === "23P01") {
            throw new AppError(409, "SHOW_OVERLAP", "This screen already has a show during that time");
        }
        throw err; // anything else keeps its real error
        }

        const prices = await Show.getPrices(db, id);
        return { show: updated, prices };
    });


module.exports = { createShow, updateShow };