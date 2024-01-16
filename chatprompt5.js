const project = 'beyondcorp-test-339706';
const location = 'us-central1';
const aiplatform = require('@google-cloud/aiplatform');
const { PredictionServiceClient } = aiplatform.v1;
const { helpers } = aiplatform;
const fs = require('fs');
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
    candidateCount: 1,
    maxOutputTokens: 1024,
    temperature: 0.9,
    topP: 1
  };
  const parameters = helpers.toValue(parameter);
  const recentResponses = [];

  let prompt = {};

  while (true) 
  {
    // 1. Get user input from the console
    const nextInput = await getUserInput();
    const jsonData = fs.readFileSync('example.json');
    const examples = JSON.parse(jsonData);

   
    
    prompt = 
    {
      examples:examples,
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
  }
  readline.close();
}
callPredict();