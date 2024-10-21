export const grantClientFreeMonth = async (
  appUserId: string,
  entitlementIdentifier: string = "Premium"
) => {
  const cloudFunctionUrl = "https://grantfreemonth-tk33gbjiva-ey.a.run.app";

  const requestBody = {
    appUserId,
    entitlementIdentifier,
  };

  try {
    const response = await fetch(cloudFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // TODO: Add type on data
    // Type is CustomerInfo from Revenuecat API but we don't have the type in euneo core
    const data = await response.json();
    // console.log("Success:", data);

    return { success: true, data: data };
  } catch (error) {
    console.error("Error calling grantFreeMonth function:", error);
    return { success: false, data: null };
  }
};
