import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
// import { Firestore } from 'firebase/firestore';
// import { doc, setDoc } from 'firebase/firestore';
import firebase from 'firebase-admin';
import admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://negotiation-chatbot-app.firebaseio.com"
});

const sessionId = Date.now().toString();

// const app = initializeApp(firebaseConfig);

const db = getFirestore();

let offerList: number[] = [];
offerList.push(5);

const initializeSession = async () => {
    const offerRef = db.collection(sessionId).doc('offers');
    await offerRef.set({ offers: [] });

    const nameRef = db.collection(sessionId).doc('name');
    await nameRef.set({ name: "" });
}

initializeSession();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(async (req, res) => {
    res.set('Accept', 'application/json');
    res.set('Access-Control-Allow-Origin', '*');

    const intent = req.body.queryResult.intent.displayName;
    const params = req.body.queryResult.parameters;

    let jsonResponse = {
        fulfillment_messages: [
            {
                text: {
                    text: ["no intents detected"],
                },
            },
        ]
    };
    if (intent === "GetName") {
        const nameRef = db.collection(sessionId).doc('name');

        try {
            await nameRef.get().then((doc) => {
                let name: string = doc.data()?.name;
                jsonResponse = {
                    fulfillment_messages: [
                        {
                            text: {
                                text: [`Your name is ${name}.`],
                            },
                        },
                    ],
                };
            }).catch((error) => {
                jsonResponse = {
                    fulfillment_messages: [
                        {
                            text: {
                                text: [`Error getting document: ${error}`],
                            },
                        },
                    ],
                };
            });
        } catch (error) {
            jsonResponse = {
                fulfillment_messages: [
                    {
                        text: {
                            text: [`Error getting document: ${error}`],
                        },
                    },
                ],
            };
        }
    } else if (intent === "SetName") {
        const name = params["given-name"];

        const nameRef = db.collection(sessionId).doc('name');

        nameRef.set({ name: name });

        jsonResponse = {
            fulfillment_messages: [
                {
                    text: {
                        text: [`Your name is ${name}.`],
                    },
                },
            ],
        };
    } else if (intent === "Offer") {
        const offer = params.offer;

        if (offer < 7000 || offer > 20000) {
            jsonResponse = {
                fulfillment_messages: [
                    {
                        text: {
                            text: [`Your offer must be between 7000 and 20000.`],
                        },
                    },
                ],
            };
        } else {
            const offerRef = db.collection(sessionId).doc('offers');

            await offerRef.update({
                offers: firebase.firestore.FieldValue.arrayUnion(offer)
            });

            await offerRef.get().then((doc) => {
                const data = doc.data();
                if (!data) return;

                const offers: number[] = data.offers;
                if (offers.length === 0) {
                    jsonResponse = {
                        fulfillment_messages: [
                            {
                                text: {
                                    text: [`No offers have been made yet`],
                                },
                            },
                        ],
                    };
                    return;
                }

                const average = offers.reduce((a: number, b: number) => a + b) / offers.length;

                jsonResponse = {
                    fulfillment_messages: [
                        {
                            text: {
                                text: [`The average offer is ${average}`],
                            },
                        },
                    ],
                };
            });
        }
    } else {
        jsonResponse = {
            fulfillment_messages: [
                {
                    text: {
                        text: [
                            `There are no fulfillment responses defined for "${intent}"" tag`,
                        ],
                    },
                },
            ],
        };
    }
    res.send(jsonResponse);
});