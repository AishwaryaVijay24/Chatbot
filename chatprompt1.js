const project = 'beyondcorp-test-339706';
const location = 'us-central1';
const aiplatform = require('@google-cloud/aiplatform');
const { PredictionServiceClient } = aiplatform.v1;
const { helpers } = aiplatform;
const clientOptions =
{
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};
const publisher = 'google';
const model = 'chat-bison@002';
const predictionServiceClient = new PredictionServiceClient(clientOptions);

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getUserInput() {
  return new Promise((resolve) => {
    readline.question('Enter your message (or type "quit" to exit): ', (input) => {
    resolve(input);
    });
  });
}

async function callPredict() 
{
  const endpoint = `projects/${project}/locations/${location}/publishers/${publisher}/models/${model}`;

  const parameter = {
    temperature: 0.8,
    maxOutputTokens: 256,
    topP: 0.99,
    topK: 40,
  };
  const parameters = helpers.toValue(parameter);
  const recentResponses = [];

  let conversationHistory = [];
  let currentEntity = null;
  let prompt = {};

  while (true) 
  {
    // 1. Get user input from the console
    const nextInput = await getUserInput();
    prompt = 
    {
      examples:
      [
        {
          input: { content: 'Name 5 cities in India?' },
          output:
          {
            content: 'Mumbai, Pune, Bangalore, Hyderabad, Pune',
          },
        },
      ],

      messages:
      [
        { author: "user", content: nextInput },
      ],
    };

    const instanceValue = helpers.toValue(prompt);
    const instances = [instanceValue];
    const request =
    {
      endpoint,
      instances,
      parameters,
    };

    if (nextInput === 'quit' || nextInput === 'exit') 
    {
      break;
    }

    if (nextInput.startsWith("any other") || currentEntity) 
    {
      
        prompt.messages =
      [
        { author: "user", content: conversationHistory[conversationHistory.length - 1].modelResponse },
        { author: "user", content: nextInput },
        ...(currentEntity ? [{ author: "system", content: `Continuing with ${currentEntity}...` }] : []),
      ];
    } 
    else
    {
      currentEntity = null;
      prompt.messages =
      [
        { author: "user", content: nextInput },
        { author: "system", content: "Please provide specific details or elaborate on your question." },
      ];
    }

    const [response] = await predictionServiceClient.predict(request);
    const content = response.predictions[0].structValue.fields.candidates.listValue.values[0].structValue.fields.content.stringValue;

    if (recentResponses.includes(content)) 
    {
      console.log("I've already provided a similar response. Can you rephrase your question or provide more context?");
      continue; 
    }
    recentResponses.push(content);
    recentResponses.shift();

    console.log('Content:', content);
    conversationHistory.push({ userInput: nextInput, modelResponse: content });
  }
  readline.close();
}
callPredict();
