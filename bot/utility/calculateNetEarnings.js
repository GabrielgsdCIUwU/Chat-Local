/**
 * Calculates net earnings. If the user has a pending debt, 20% of the earnings 
 * will be deducted to pay off the debt.
 * @param {number} grossEarning - The gross amount of earnings
 * @param {Object} user - The user object containing financial data
 * @returns {number} The net earnings after debt deduction
 */
export function calculateNetEarnings(earning, user) {
    let debt = user.debt;
    if (debt > 0) {
        let payDebt = Math.floor(earning * 0.2);

        if (payDebt > debt) {
            payDebt = debt;
        }

        user.debt -= payDebt;
        let actualEarnings = earning - payDebt;
        user.totalEarnings += actualEarnings;
        return actualEarnings;
    } else {
        user.totalEarnings += earning;
        return earning;
    }
}