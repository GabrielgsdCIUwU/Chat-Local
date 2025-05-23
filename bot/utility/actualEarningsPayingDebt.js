/**
 * Calcula la cantidad de ganancias netas. Si el usuario tiene una deuda pendiente, se le quitará el 20% pagando la deuda.
 * @param {number} earning - Cantidad de ganancias en bruto
 * @param {Object} user - Todos los datos del usuario
 * @returns {number} Cantidad de ganancias netas
 */

export function actualEarningsPayingDebt(earning, user) {
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