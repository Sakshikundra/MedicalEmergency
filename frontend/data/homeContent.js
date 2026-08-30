export const features = [
    {
        id: 'emergency-card',
        icon: 'shield',
        title: 'A card that works without you',
        description:
            'Blood group, allergies, conditions and next of kin sit on your lock screen. No password, no app to install.',
    },
    {
        id: 'scan-access',
        icon: 'scan',
        title: 'One scan for responders',
        description:
            'Paramedics scan the code and see what matters in the first ten minutes. Nothing else opens.',
    },
    {
        id: 'meds',
        icon: 'pill',
        title: 'Medications kept current',
        description:
            'Prescriptions sync from your pharmacy, so nobody has to guess a dosage or an interaction.',
    },
    {
        id: 'records',
        icon: 'share',
        title: 'Records that travel with you',
        description:
            'Scans, labs and discharge notes from every hospital, gathered into one timeline you own.',
    },
    {
        id: 'audit',
        icon: 'clock',
        title: 'A named access trail',
        description:
            'Every view is timestamped and attributed. You are notified the moment your record is opened.',
    },
    {
        id: 'encryption',
        icon: 'lock',
        title: 'Encrypted on your device',
        description:
            'Records are sealed with keys that stay on your phone. Emergency access is granted per incident.',
    },
];

export const steps = [
    {
        index: '01',
        title: 'Build your profile',
        description:
            'Import from your hospital portals or type it in. Most people finish in about five minutes.',
    },
    {
        index: '02',
        title: 'Carry the code',
        description:
            'Your Medix code lives on the lock screen, a wallet card, and a wearable band.',
    },
    {
        index: '03',
        title: 'Responders get context',
        description:
            'The critical layer unlocks on scan. Everything else stays closed until you say otherwise.',
    },
];

export const stats = [
    { value: '11 sec', label: 'Median time to critical info' },
    { value: '2.4 M', label: 'Records under protection' },
    { value: '890', label: 'Hospitals connected' },
    { value: '100%', label: 'Access events logged' },
];
