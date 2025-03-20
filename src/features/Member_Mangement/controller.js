import {
  responseHandler,
  errorHandler,
  statusMaker,
  apiMessages,
  checkEmptyArray,
  tier_mangement,
} from "./index";

export const create = async (req, res) => {
  try {
    const {
      id,
      start_mangement,
      financial_year,
      benefits,
      survey_mangement,
      profile_update,
      tier_benefits,
      bonus_benefits,
      twoX_reward_point,
      birthday_card,
      marriage_anniversary_card,
      store
    } = req.body;

    let tier;

    // Check if ID exists; if so, attempt to update the existing record
    if (id) {
      tier = await tier_mangement.findOne({ where: { id } });

      if (tier) {
        // Update the record if found
        await tier.update({
          start_mangement: JSON.stringify(start_mangement),
          financial_year: JSON.stringify(financial_year),
          benefits: JSON.stringify(benefits),
          survey_mangement: JSON.stringify(survey_mangement),
          profile_update: JSON.stringify(profile_update),
          tier_benefits: JSON.stringify(tier_benefits),
          bonus_benefits: JSON.stringify(bonus_benefits),
          twoX_reward_point: JSON.stringify(twoX_reward_point),
          birthday_card,
          marriage_anniversary_card,
          store
        });

        // Send successful update response
        const response = responseHandler(
          statusMaker.updated,
          apiMessages.update,
          tier
        );
        return res.status(statusMaker.updated).json(response);
      }
    }

    const newTier = await tier_mangement.create({
      start_mangement: JSON.stringify(start_mangement),
      financial_year: JSON.stringify(financial_year),
      benefits: JSON.stringify(benefits),
      survey_mangement: JSON.stringify(survey_mangement),
      profile_update: JSON.stringify(profile_update),
      tier_benefits: JSON.stringify(tier_benefits),
      bonus_benefits: JSON.stringify(bonus_benefits),
      twoX_reward_point: JSON.stringify(twoX_reward_point),
      birthday_card,
      marriage_anniversary_card,
      store
    });

    const response = responseHandler(
      statusMaker.created,
      apiMessages.create,
      newTier
    );
    return res.status(statusMaker.created).json(response);
  } catch (error) {
    // Error handling
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};

export const list = async (req, res) => {
  try {
    const { store } = req.query;
    const filter = store ? { store } : {};
    const modules = await tier_mangement.findAll({
      where: filter,
    });
    if (checkEmptyArray(modules)) {
      const response = responseHandler(
        statusMaker.notFound,
        apiMessages.notFound,
        modules
      );
      return res.status(statusMaker.notFound).json(response);
    }
    const response = responseHandler(
      statusMaker.found,
      apiMessages.found,
      modules
    );
    return res.status(statusMaker.found).json(response);
  } catch (error) {
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
  
};

export const updateCard = async (req, res) => {
  try {
    const { id, birthday_card, marriage_anniversary_card } = req.body;
    if (!id) {
      return res.status(statusMaker.badRequest).json({
        message: "ID is required to update a record.",
      });
    }
    const tier = await tier_mangement.findOne({ where: { id } });
    if (!tier) {
      return res.status(statusMaker.notFound).json({
        message: `No record found with ID: ${id}`,
      });
    }
    await tier.update({
      birthday_card,
      marriage_anniversary_card,
    });
    const response = responseHandler(
      statusMaker.updated,
      apiMessages.update,
      tier
    );
    return res.status(statusMaker.updated).json(response);
  } catch (error) {
    console.error("Error updating card:", error);
    const response = errorHandler(error);
    return res.status(statusMaker.internalError).json(response);
  }
};




