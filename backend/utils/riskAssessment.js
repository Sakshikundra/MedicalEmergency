/**
 * Assess risk level based on medical analysis
 * @param {Object} aiAnalysis - AI analysis from LLM
 * @returns {Object} Risk assessment {level, factors, interactions}
 */
const assessRiskLevel = (aiAnalysis) => {
    const {
        diagnoses = [],
        allergies = [],
        chronicConditions = [],
        medications = [],
        criticalAlerts = [],
        drugInteractions = [],
    } = aiAnalysis;

    let riskLevel = 'GREEN';
    const riskFactors = [];

    // RED level conditions (high risk)
    const criticalConditions = [
        'cardiac arrest', 'heart attack', 'myocardial infarction', 'stroke',
        'severe bleeding', 'anaphylaxis', 'respiratory failure',
        'diabetic ketoacidosis', 'severe asthma', 'seizure disorder',
    ];

    const hasCriticalCondition = [...diagnoses, ...chronicConditions].some(condition =>
        criticalConditions.some(critical =>
            condition.toLowerCase().includes(critical.toLowerCase())
        )
    );

    if (hasCriticalCondition || criticalAlerts.length > 0) {
        riskLevel = 'RED';
        riskFactors.push('Critical medical condition detected');
    }

    // Check for severe allergies
    const severeAllergies = ['penicillin', 'peanut', 'latex', 'bee sting', 'shellfish'];
    const hasSevereAllergy = allergies.some(allergy =>
        severeAllergies.some(severe =>
            allergy.toLowerCase().includes(severe.toLowerCase())
        )
    );

    if (hasSevereAllergy) {
        if (riskLevel !== 'RED') riskLevel = 'YELLOW';
        riskFactors.push('Severe allergy documented');
    }

    // Check for drug interactions
    if (drugInteractions.length > 0) {
        if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
        riskFactors.push('Potential drug interactions identified');
    }

    // Check for multiple chronic conditions
    if (chronicConditions.length >= 3) {
        if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
        riskFactors.push('Multiple chronic conditions');
    }

    // Check for polypharmacy (5+ medications)
    if (medications.length >= 5) {
        if (riskLevel === 'GREEN') riskLevel = 'YELLOW';
        riskFactors.push('Multiple medications (polypharmacy)');
    }

    // Age-based risk (if available - to be added later)
    // Pregnancy status (if available - to be added later)

    return {
        riskLevel,
        riskFactors,
        drugInteractions,
        criticalAlerts,
    };
};

/**
 * Detect known drug interactions
 * @param {Array} medications - List of medications
 * @returns {Array} List of potential interactions
 */
const detectDrugInteractions = (medications) => {
    const interactions = [];

    // Common drug interaction pairs (simplified)
    const interactionPairs = {
        'warfarin': ['aspirin', 'ibuprofen', 'naproxen'],
        'metformin': ['alcohol'],
        'lisinopril': ['potassium supplements'],
        'simvastatin': ['grapefruit'],
        'methotrexate': ['ibuprofen', 'aspirin'],
    };

    const medNames = medications.map(med =>
        typeof med === 'string' ? med.toLowerCase() : med.name.toLowerCase()
    );

    for (const [drug, contraindications] of Object.entries(interactionPairs)) {
        if (medNames.some(med => med.includes(drug))) {
            contraindications.forEach(contra => {
                if (medNames.some(med => med.includes(contra))) {
                    interactions.push(`${drug} + ${contra}: Potential interaction detected`);
                }
            });
        }
    }

    return interactions;
};

module.exports = {
    assessRiskLevel,
    detectDrugInteractions,
};
