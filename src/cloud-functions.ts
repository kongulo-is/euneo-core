// Function used to call our grantGift cloud function. Returns a promise with the response from the cloud function.
export const grantClientFreeGift = async (
  appUserId: string,
  type: "month" | "week"
): Promise<{ success: boolean; data: any }> => {
  const requestBody = {
    appUserId,
    entitlementIdentifier: "Premium",
    type,
  };

  try {
    const response = await fetch(
      "https://grantfreegift-tk33gbjiva-ey.a.run.app",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // TODO: Add type on data
    // Type is CustomerInfo from Revenuecat API but we don't have the type in euneo core
    const data = await response.json();
    // console.log("Success:", data);

    return data;
  } catch (error) {
    console.error("Error calling grantFreeGift function:", error);
    return { success: false, data: null };
  }
};

export const grantClientFreeMonth = async (
  appUserId: string,
  entitlementIdentifier: string = "Premium"
): Promise<{ success: boolean; data: any }> => {
  const requestBody = {
    appUserId,
    entitlementIdentifier,
  };

  try {
    const response = await fetch(
      "https://grantfreemonth-tk33gbjiva-ey.a.run.app",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // TODO: Add type on data
    // Type is CustomerInfo from Revenuecat API but we don't have the type in euneo core
    const data = await response.json();
    // console.log("Success:", data);

    return data;
  } catch (error) {
    console.error("Error calling grantFreeMonth function:", error);
    return { success: false, data: null };
  }
};
