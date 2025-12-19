const connection = require('../db')

/**
 * расчет столешницы
 * @param {*} param0 
 * @returns 
 */
async function calculate({ shape, dimentions, stone, chamfer, additional }){
    let lengthsSum = 0
    let lengthToCut = 0
    let width = 0 //ширина столешницы, которую ввел пользователь
    let arrayLengths = [] //длины, которые ввел пользователь
    // let slab = {} //стоимость и длина
    const slab = await getLengthSlab(stone) //получаем цены и длину листа
    const {chamferPrice, processPrice} = await getAllPrice(chamfer)
    //поправочное слогаемое, чтобы правильно вычислить длину фаски
    //длины столешницы складываются и прибавляется два торца
    //если столешница не прямая, то в суммарной длине столешницы уже сидит как минимум один торец
    const correction = (Object.values(dimentions).filter(value => value !== '').length - 2 ) * 2

    if (stone.producer && stone.color) {
        width = +dimentions.length_a
        for(length of Object.keys(dimentions)){
            if(length !== 'length_a'){
                arrayLengths.push(+dimentions[length])
                lengthsSum += +dimentions[length]
            }
        }   
    }
    //sustract from C and D 600mm
    lengthToCut += 2 * (arrayLengths[0] + +dimentions.length_a) / 1000
    for (let i = 1; i < arrayLengths.length; i++){
        arrayLengths[i] -= 600
        lengthToCut += 2 * (arrayLengths[i] + +dimentions.length_a) / 1000
    }
    const lengthChamfer = (lengthsSum + width * (2 - correction)) / 1000
    const countSlab = countQuantitySlabs(slab, arrayLengths) * 0.5
    const deliveryHalf = (countSlab - Math.trunc(countSlab)) / 0.5

    const sum =
        countSlab * slab.price + 
        lengthToCut * processPrice.cutting +
        lengthChamfer * chamferPrice +
        processPrice.cuttingFigure * 2 +
        (additional.sink ? 1 : 0) * (processPrice.cuttingWashing + processPrice.drillWaterTap) +
        (additional.montage ? 1 : 0) * lengthsSum /1000 * processPrice.mountCountertop +
        (additional.delivery ? 1 : 0) * processPrice.deliveryProduct +
        deliveryHalf * processPrice.deliveryStoneHalf +
        Math.trunc(countSlab) * processPrice.deliveryStoneOne

        // console.log(countSlab * slab.price,
        //     lengthToCut, processPrice.cutting, 
        //     lengthChamfer,chamferPrice, 
        //     processPrice.cuttingFigure * 2, 
        //     (additional.sink ? 1 : 0) * (processPrice.cuttingWashing + processPrice.drillWaterTap),
        // (additional.montage ? 1 : 0) * lengthsSum /1000 * processPrice.mountCountertop,
        // (additional.delivery ? 1 : 0) * processPrice.deliveryProduct,
        // deliveryHalf , processPrice.deliveryStoneHalf, 
        // Math.trunc(countSlab),processPrice.deliveryStoneOne
        // )

    return sum
}

/**
 * возвращает количество половинок листов
 * @param {*} slab 
 * @param {*} arrayLengths 
 * @returns 
 */
function countQuantitySlabs(slab, arrayLengths) {
    let count = 0;
    let ratio = 0     
    let length = slab.length - 20 //уменьшение на ширину торцевки
    let userLength = 0;
    let currentRemainder = 0;
    let arrayRemainders = []; // массив остатков

    arrayLengths.sort((a, b) => b - a);//sort from max to min

    while (arrayLengths.length != 0) {
        userLength = arrayLengths.shift()//get and delete first userLength from arrayUserLength
        for (let i = 0; i < arrayRemainders.length; i++) {
            if (arrayRemainders[i] >= userLength) {
                currentRemainder = arrayRemainders[i] - userLength;
                userLength = 0;
                arrayRemainders.splice(i, 1);
                break;
            }
        }

        if (currentRemainder === 0 && userLength != 0) {
            currentRemainder = length;
            if (currentRemainder >= userLength) {				
                currentRemainder -= userLength;
                count += 1;
            } else {
                ratio =  userLength / length;
                currentRemainder = length * (1 - (ratio - Math.trunc(ratio)));
                count += Math.trunc(ratio) + 1;
            }
        }

        arrayRemainders.push(currentRemainder);
        arrayRemainders.sort((a, b) => a - b);
        currentRemainder = 0;
    }
    return count;
}

/**
 * по поступившим данным выбирает длину листа и его стоимость
 * @param {*} data 
 * @returns 
 */
async function getLengthSlab(stone){
    const data = await connection.promise().query('SELECT * FROM ' + `${stone.producer}` + ' WHERE ' + 'color=?', [stone.color])    
    const {normalLength, jamboLength, normlPrice, jamboPrice} = data[0][0]
    if(normalLength){
        return {
            price: normlPrice,
            length: normalLength
        }
    } else if (jamboLength){
        return {
            price: jamboPrice,
            length: jamboLength
        }
    }
}

async function getAllPrice(chamfer){
    const chamferPriceArray = await connection.promise().query('SELECT price FROM chamfers WHERE type=?', [chamfer])
    const chamferPrice = chamferPriceArray[0][0].price
    const processPriceArray = await connection.promise().query('SELECT * FROM processingPrice')
    const processPrice = processPriceArray[0].reduce((processes, process) => {
        processes[process.process] = process.price;
        return processes;
    }, {});
    return {chamferPrice, processPrice}  
}

module.exports = {calculate}
