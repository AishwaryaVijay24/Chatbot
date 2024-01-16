const project = 'beyondcorp-test-339706';
const location = 'us-central1';
const aiplatform = require('@google-cloud/aiplatform');
const {PredictionServiceClient} = aiplatform.v1;
const {helpers} = aiplatform;

// Specifies the location of the api endpoint
const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};
const publisher = 'google';
const model = 'chat-bison@001';

// Instantiates a client
const predictionServiceClient = new PredictionServiceClient(clientOptions);

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

function getUserInput()
{
  return new Promise((resolve) =>
  {
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
 
  // Predict request
  let prompt = {};

    while (true)
    {
      // 1. Get user input from the console
     const nextInput = await getUserInput();
     prompt = {
    
        examples: [
          {
            input: {content: 'How many moons does Mars have?'},
            output: {
            content: 'The planet Mars has two moons, Phobos and Deimos.',
            },
          },
        ],

        messages: [
            { author: "user", content: nextInput },
        ],
      };

    const instanceValue = helpers.toValue(prompt);
    const instances = [instanceValue];
    const request = {
        endpoint,
        instances,
        parameters,
      };

      // 2. Check for exit command
      if (nextInput === 'quit' || nextInput === 'exit') {
        break;
      }

      // 3. Construct the prompt with user input and system prompt
      prompt.messages = [
        { author: "user", content: nextInput }, // Include user's latest input
        { author: "system", content: "Please provide specific details or elaborate on your question." }
      ];
     
      // 5. Send prediction request
      const [response] = await predictionServiceClient.predict(request);
      const content = response.predictions[0].structValue.fields.candidates.listValue.values[0].structValue.fields.content.stringValue;
      
      // 6. Handle repetitive responses
      if (recentResponses.includes(content)) {
        console.log("I've already provided a similar response. Can you rephrase your question or provide more context?");
        continue; // Skip to the next iteration to get new input
      }
      recentResponses.push(content);
      recentResponses.shift();
      // 7. Display model's response
      console.log('Content:', content);
    }
readline.close();
}
callPredict();
