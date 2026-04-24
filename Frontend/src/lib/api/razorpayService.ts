import axios from "axios";

// Assuming we have an axios instance globally configured or we just use basic axios.
// Best is to use the existing api instance, let's create a dedicated service that imports it.
import api from "../api";

export const razorpayService = {
  getSettings: async () => {
    const response = await api.get("/payments/razorpay/settings");
    return response.data;
  },
  updateSettings: async (data: any) => {
    const response = await api.put("/payments/razorpay/settings", data);
    return response.data;
  },
  createOrder: async (courseIds: string[], amount: number, couponId?: string) => {
    const response = await api.post("/payments/razorpay/create-order", { courseIds, amount, couponId });
    return response.data;
  },
  verifyPayment: async (data: { paymentId: string; orderId: string; signature: string }) => {
    const response = await api.post("/payments/razorpay/verify", data);
    return response.data;
  }
};
