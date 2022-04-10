import axios from 'axios';
import Noty from 'Noty';
import { initAdmin } from './admin';
import moment from 'moment';

let addToCart = document.querySelectorAll('.add-to-cart');
let cartCounter = document.querySelector('#cart-counter');
let clearCart = document.querySelector('#clear-cart');

function updateCart(pizza) {
    axios
        .post('/update-cart', pizza)
        .then((res) => {
            cartCounter.innerText = res.data.totalQty;
            new Noty({
                type: 'success',
                text: 'Item added to cart',
                progressBar: 'false',
                timeout: 1000,
            }).show();
        })
        .catch((err) => {
            new Noty({
                type: 'error',
                text: 'Something went wrong',
                progressBar: 'false',
                timeout: 1000,
            }).show();
        });
}

addToCart.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        let pizza = JSON.parse(btn.dataset.pizza);
        updateCart(pizza);
    });
});

const alertMsg = document.querySelector('#success-alert');
if (alertMsg) {
    setTimeout(() => {
        alertMsg.remove();
    }, 2000);
}

//change order status
let statuses = document.querySelectorAll('.status_line');

let hiddenInput = document.querySelector('#hiddenInput');

let order = hiddenInput ? hiddenInput.value : null;
order = JSON.parse(order);
let time = document.createElement('small');

function updateStatus(order) {
    statuses.forEach((status) => {
        status.classList.remove('step-completed');
        status.classList.remove('current');
    });
    let stepCompleted = true;
    statuses.forEach((singleStatus) => {
        let dataProp = singleStatus.dataset.status;

        if (stepCompleted) {
            singleStatus.classList.add('step-completed');
        }

        if (dataProp === order.status) {
            stepCompleted = false;
            time.innerText = moment(order.updatedAt).format('hh:mm A');
            singleStatus.appendChild(time);
            if (singleStatus.nextElementSibling) {
                singleStatus.nextElementSibling.classList.add('current');
            }
        }
    });
}

updateStatus(order);

//socket
let socket = io();

//join

if (order) {
    socket.emit('join', `order_${order._id}`);
}

let adminAreaPath = window.location.pathname;

if (adminAreaPath.includes('admin')) {
    initAdmin(socket);
    socket.emit('join', 'adminRoom');
}

socket.on('orderUpdated', (data) => {
    const updatedOrder = { ...order };
    updatedOrder.updatedAt = moment().format();
    updatedOrder.status = data.status;
    updateStatus(updatedOrder);
    new Noty({
        type: 'success',
        text: 'Order Updated',
        progressBar: 'false',
        timeout: 1000,
    }).show();
});

// function emptyCart(cartList) {
//     axios
//         .post("/empty-cart", cartList)
//         .then((res) => {
//             console.log(res.data.totalQty);
//             cartCounter.innerText = res.data.totalQty;
//             new Noty({
//                 type: "success",
//                 text: "Cart is Empty",
//                 progressBar: "false",
//                 timeout: 1000,
//             }).show();
//         })
//         .catch((err) => {
//             console.error(err);
//             new Noty({
//                 type: "error",
//                 text: "Something went wrong",
//                 progressBar: "false",
//                 timeout: 1000,
//             }).show();
//         });
// }
// if (clearCart) {
//     clearCart.addEventListener("click", (e) => {
//         console.log(clearCart.dataset.cart);
//         let cartList = JSON.parse(clearCart.dataset.cart);
//         emptyCart(cartList);
//     });
// }
