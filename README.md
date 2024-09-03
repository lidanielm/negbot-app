# Application for Negotiation Chatbot

Hi! I'm Daniel Li, a sophomore studying computer science. This is my submission for the application for the Negotiation Chatbot developer position.

This chatbot satisfies all the necessary requirements:
- stores a list of offers from the user in Firebase
- stores user's name in Firebase
- calculates the average of all offers

Sessions can also be restarted by entering "Restart negotiation" into the Dialogflow test console.

## Commands:
Set user's name: "My name is {name}"
- Response: "Hello, {name}."
Ask for user's name: "What is my name?"
- Response: "Your name is {name}."
Propose an offer: "How about {offer}?"
- Response: "The average is [average of all offers]"
Restart negotiation: "Restart negotiation"
- Response: "Negotiation restarted."

## How to run:
Run the following command in the terminal to deploy the webhook:
```
firebase deploy --only functions,hosting
```