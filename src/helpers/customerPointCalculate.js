export const customerPointCalculation = ({ earned_point = 0, redeem_point = 0, expiry_point = 0 }) => {
    const earned = parseInt(earned_point, 10) || 0;
    const redeem = parseInt(redeem_point, 10) || 0;
    const expiry = parseInt(expiry_point, 10) || 0;
    const balance_point = earned - redeem - expiry;
  
    return {
      earned_point: earned,
      redeem_point: redeem,
      expiry_point: expiry,
      balance_point,
    };
  };
  
