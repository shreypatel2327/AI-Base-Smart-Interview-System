import api from './api';

export const createOrder = async () => {
    const response = await api.post('/payment/create-order');
    return response.data;
};

export const verifyPayment = async (paymentData) => {
    const response = await api.post('/payment/verify', paymentData);
    return response.data;
};

export const reportFailure = async (failureData) => {
    const response = await api.post('/payment/failed', failureData);
    return response.data;
};
