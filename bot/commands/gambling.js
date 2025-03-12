import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);





//region actualEarnings
function actualEarningsPayingDebt(earning, user) {
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


const subcommandsPath = path.join(__dirname, "./gambling");

// Función para cargar y ejecutar un subcomando
async function loadSubcommand(subcommandName) {
    try {
        const subcommandPath = pathToFileURL(path.join(subcommandsPath, `${subcommandName}.js`)).href;
        return await import(subcommandPath);
    } catch (error) {
        return null;
    }
}


export function execute({ args, socket, io, username }) {

    const timestamp = new Date().getTime();
    const gamblingFilePath = path.join(__dirname, "../../public/json/gambling.json");

    fs.readFile(gamblingFilePath, "utf-8", async (err, data) => {
        if (err) {
            console.error("Error al leer el archivo de gambling:", err);
            io.emit("sendmsg", { user: "🤖 Bot", message: "Hubo un error al ejecutar el comando", timestamp })
            return;
        }

        let currenData = JSON.parse(data);
        const userIndex = currenData.findIndex((user) => user.name === username);

        if (userIndex === -1) {
            const newGambler = { name: username, money: 100, totalEarnings: 0, spend: 0, timesSteal: 0, moneySteal: 0, duelWin: 0, duelLose: 0, bankRupt: 0, debt: 0 };
            currenData.push(newGambler);
            fs.writeFile(gamblingFilePath, JSON.stringify(currenData, null, 2), "utf-8", (err) => {
                if (err) {
                    console.error("Error al guardar al nuevo gambler:", err);
                    io.emit("sendmsg", { user: "🤖 Bot", message: "Hubo un error al ejecutar el comando", timestamp });
                    return;
                }
                io.emit("sendmsg", { user: "🤖 Bot", message: "Se te acaba de registrar, ejecuta otra vez el comando. LET'S GO GAMBLING!", timestamp })
            });
            return;
        }
        
        const subcommandName = args[0];
        const subcommand = await loadSubcommand(subcommandName);
        try {
            if (subcommand && subcommand.execute) {
                subcommand.execute({ args: args.slice(1), socket, io, username, currenData, userIndex, actualEarningsPayingDebt });
            }
        } catch (err) {
            console.log(err)
            io.emit("sendmsg", { user: "🤖 Bot", message: `El subcomando "${subcommandName}" no existe.`, timestamp });
        }

        //region actualizar datos
        fs.writeFile(gamblingFilePath, JSON.stringify(currenData, null, 2), "utf-8", (err) => {
            if (err) {
                console.error("Error al actualizar los datos de gambling:", err);
                return io.emit("sendmsg", { user: "🤖 Bot", message: "Hubo un error al guardar los cambios, se ha vuelto al estado anterior", timestamp });
            }
        });
    });
}