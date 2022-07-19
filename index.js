// Módulos Externos
const inquirer = require('inquirer')
const chalk = require('chalk')

// Módulos Internos
const fs = require('fs')
const { get } = require('http')
operation()

function operation() {
    inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'O que você deseja fazer?',
        choices: ['Criar conta', 'Consultar Saldo', 'Depositar', 'Sacar', 'Transferência', 'Sair']
    }]).then((answer) => {
        const action = answer.action
        if (action === 'Criar conta') {
            createAccount()
        } else if (action === 'Depositar') {
            deposit()
        } else if (action === 'Consultar Saldo') {
            getAccountBalance()
        } else if (action === 'Sacar') {
            withdraw()
        } else if (action === 'Transferência') {
            transfer()
        } else if (action === 'Sair') {
            console.log(chalk.bgBlue.black('Obrigado por usar o Accounts!'))
            process.exit()
        }
    }).catch(err => console.log(err))
}
// create an account
function createAccount() {
    console.log(chalk.bgGreen.black('Parabéns por escolher o nosso banco!'))
    console.log(chalk.green('Defina as opções da sua conta a seguir'))
    buildAccount()
}

function buildAccount() {
    inquirer.prompt([{
        name: 'accountname',
        message: 'Digite um nome para a sua conta:'
    }]).then((answer) => {
        const accountname = answer.accountname
            //console.info(accountname)
        if (!fs.existsSync('accounts')) {
            fs.mkdirSync('accounts')
        }
        if (fs.existsSync(`accounts/${accountname}.json`)) {
            console.log(chalk.bgRed.black('Esta conta já existe, escolha outro nome!'))
            buildAccount()
            return
        }
        fs.writeFileSync(`accounts/${accountname}.json`, '{"balance": 0}', function(err) {
            console.log(err);
        })
        console.log(chalk.green('Parabéns, a sua conta foi criada!'))
        operation()
    }).catch((err) => console.log(err))
}


// add an amount to user account
function deposit() {
    inquirer.prompt([{
        name: 'accountname',
        message: 'Qual o nome da sua conta?'
    }]).then((answer) => {
        const accountname = answer.accountname
            // verify if account exists
        if (!checkAccount(accountname)) {
            return deposit()
        }
        inquirer.prompt([{
            name: 'amount',
            message: 'Quanto você deseja depositar?'
        }]).then((answer) => {
            const amount = answer.amount
            let transfer = false
                // add an amount
            if (!amount) {
                console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente!'))
                return deposit()
            }
            addAmount(accountname, amount, transfer)
            operation()
        }).catch((err) => console.log(err))
    }).catch((err) => console.log(err))
}

function checkAccount(accountname) {
    if (!fs.existsSync(`accounts/${accountname}.json`)) {
        console.log(chalk.bgRed.black('Esta conta não existe, escolha outra conta!'))
        return false
    }
    return true
}

function addAmount(accountname, amount, transfer) {
    let accountData = getAccount(accountname)
    accountData.balance = parseFloat(amount) + parseFloat(accountData.balance)
    fs.writeFileSync(`accounts/${accountname}.json`, JSON.stringify(accountData), function(err) {
        console.log(err)
    })
    if (!transfer) {
        console.log(chalk.green(`Foi depositado o valor de R$${amount} na sua conta! Novo valor: R$${accountData.balance}`))
    }
}

function getAccount(accountname) {
    const accountJSON = fs.readFileSync(`accounts/${accountname}.json`, {
        encoding: 'utf-8',
        flag: 'r'
    })
    return JSON.parse(accountJSON)
}
// show account balance
function getAccountBalance() {
    inquirer.prompt([{
        name: 'accountname',
        message: 'Qual o nome da sua conta?'
    }]).then((answer) => {
        const accountName = answer.accountname

        // verify if account exists
        if (!checkAccount(accountName)) {
            return getAccountBalance()
        }

        const accountData = getAccount(accountName)
        console.log(chalk.bgBlue.black(`Olá ${accountName}, o saldo da sua conta é de R$${accountData.balance}`))
        operation()
    }).catch(err => console.log(err))
}
// withdraw an amount from user account
function withdraw() {
    inquirer.prompt([{
        name: 'accountName',
        message: 'Qual o nome da sua conta?'
    }]).then((answer => {
        const accountName = answer.accountName
        if (!checkAccount(accountName)) {
            return withdraw()
        }
        inquirer.prompt([{
            name: 'amount',
            message: 'Quanto você deseja sacar?'
        }]).then((answer) => {
            const amount = answer.amount
            let transfer = false
            removeAmount(accountName, amount, transfer)
        }).catch(err => console.log(err))
    })).catch(err => console.log(err))
}

function removeAmount(accountName, amount, transfer) {
    let accountData = getAccount(accountName)
    if (!amount) {
        console.log(chalk.bgRed.black('Ocorreu um erro, tente novamente!'))
        return withdraw()
    }
    if (accountData.balance < amount) {
        console.log(chalk.bgRed.black('Valor indisponível!'))
        return withdraw()
    }
    accountData.balance = parseFloat(accountData.balance) - parseFloat(amount)
    fs.writeFileSync(`accounts/${accountName}.json`, JSON.stringify(accountData), function(err) {
        console.log(err)
    })
    if (!transfer) {
        console.log(chalk.green(`Foi realizado um saque de R$${amount} da sua conta! Novo valor: R$${accountData.balance}`))
        return operation()
    } else {
        console.log(chalk.green(`Transferência de R$${amount} realizada! Novo valor: R$${accountData.balance}`))
    }
}

function transfer() {
    inquirer.prompt([{
        name: 'accountNameFrom',
        message: 'Qual o nome da sua conta?'
    }]).then((answer) => {
        const accountNameFrom = answer.accountNameFrom
        if (!checkAccount(accountNameFrom)) {
            return transfer()
        }
        inquirer.prompt([{
            name: 'accountNameDestiny',
            message: 'Para que conta você deseja transferir?'
        }]).then((answer) => {
            const accountNameDestiny = answer.accountNameDestiny
            if (!checkAccount(accountNameDestiny)) {
                return transfer()
            }
            inquirer.prompt([{
                name: 'amount',
                message: 'Quanto você deseja transferir?'
            }]).then((answer) => {
                const amount = answer.amount
                let transfer = true
                if (!amount) {
                    console.log(chalk.bgRed.black('Ocorreu um erro. Tente novamente!'))
                    return operation()
                }
                addAmount(accountNameDestiny, amount, transfer)
                removeAmount(accountNameFrom, amount, transfer)
            }).catch(err => console.log(err))
        }).catch(err => console.log(err))
    }).catch(err => console.log(err))
}