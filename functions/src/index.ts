import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import firebase from 'firebase-admin';
import admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://negotiation-chatbot-app.firebaseio.com"
});

const db = getFirestore();

let sessionId = Date.now().toString();

const initializeSession = async () => {
    const offerRef = db.collection(sessionId).doc('offers');
    await offerRef.set({ offers: [] });

    const nameRef = db.collection(sessionId).doc('name');
    await nameRef.set({ name: "" });
}

// Initialize collection in Firestore
// Id of the collection is the current timestamp
initializeSession();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(async (req, res) => {
    res.set('Accept', 'application/json');
    res.set('Access-Control-Allow-Origin', '*');

    const intent = req.body.queryResult.intent.displayName;
    const params = req.body.queryResult.parameters;

    // Handle the different intents
    if (intent === "GetName") {
        const nameRef = db.collection(sessionId).doc('name');

        // Retrieve name from Firestore
        await nameRef.get().then((doc) => {
            let name: string = doc.data()?.name;
            res.send({
                fulfillment_messages: [
                    {
                        text: {
                            text: [`Your name is ${name}.`],
                        },
                    },
                ],
            });
            return;
        }).catch((error) => {
            res.send({
                fulfillment_messages: [
                    {
                        text: {
                            text: [`Error getting document: ${error}`],
                        },
                    },
                ],
            });
        });
    } else if (intent === "SetName") {
        const name = params["given-name"];

        const nameRef = db.collection(sessionId).doc('name');

        // Update name in Firestore
        nameRef.set({ name: name });

        res.send({
            fulfillment_messages: [
                {
                    text: {
                        text: [`Hello, ${name}.`],
                    },
                },
            ],
        });
    } else if (intent === "Offer") {
        const offer = params.offer;

        // Check if offer is within the range
        if (offer < 7000 || offer > 20000) {
            res.send({
                fulfillment_messages: [
                    {
                        text: {
                            text: [`Your offer must be between 7000 and 20000.`],
                        },
                    },
                ],
            });
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
                    res.send({
                        fulfillment_messages: [
                            {
                                text: {
                                    text: [`No offers have been made yet`],
                                },
                            },
                        ],
                    });
                    return;
                }

                const average = offers.reduce((a: number, b: number) => a + b) / offers.length;

                // Format average to 2 decimal places if it is a float
                if (Number.isInteger(average)) {
                    res.send({
                        fulfillment_messages: [
                            {
                                text: {
                                    text: [`The average offer is ${average}`],
                                },
                            },
                        ],
                    });
                } else {
                    res.send({
                        fulfillment_messages: [
                            {
                                text: {
                                    text: [`The average offer is ${average.toFixed(2)}`],
                                },
                            },
                        ],
                    });
                }


            });
        }
    } else if (intent === "RestartNegotiation") {
        // Initialize collection in Firestore
        // Id of the collection is the current timestamp
        sessionId = Date.now().toString();

        initializeSession();

        res.send({
            fulfillment_messages: [
                {
                    text: {
                        text: [`Negotiation has been restarted.`],
                    },
                },
            ],
        });
    }
    else {
        res.send({
            fulfillment_messages: [
                {
                    text: {
                        text: [
                            `There are no fulfillment responses defined for "${intent}" tag`,
                        ],
                    },
                },
            ],
        });
    }
});