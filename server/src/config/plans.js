const plans = {
  free: {
    id: "free",
    productLimit: 10,
  },
  founding: {
    id: "founding",
    productLimit: 50,
  },
  growth: {
    id: "growth",
    productLimit: 200,
  },
};

const getPlan = (planId) => plans[planId] || plans.free;

module.exports = {
  getPlan,
  plans,
};
