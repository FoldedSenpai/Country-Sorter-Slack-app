const { WebClient, LogLevel } = require("@slack/web-api");
const client = new WebClient("xoxb-your_bot_token_here", {
  logLevel: LogLevel.DEBUG
});
const { App } = require('@slack/bolt');
const { fetchAllCountries } = require('./app');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

app.event('app_mention', async ({ event, context, client, say }) => {
  try {
    await say({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Choose an option how to sort the countries:'
          },
          accessory: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select Sorting Option'
            },
            action_id: 'sort_dropdown',
            options: [
              {
                text: {
                  type: 'plain_text',
                  text: 'Alphabetical Order'
                },
                value: 'sort_alphabetically'
              },
              {
                text: {
                  type: 'plain_text',
                  text: 'Population Size'
                },
                value: 'sort_by_population'
              },
              {
                text: {
                  type: 'plain_text',
                  text: 'Land Area'
                },
                value: 'sort_by_land_area'
              }
            ]
          }
        }
      ]
    });
  } catch (error) {
    console.error(error);
  }
});

app.action('sort_dropdown', async ({ ack, body, client }) => {
  try {
    await ack();
    const selectedOption = body.actions[0].selected_option.value;
    let sortedCountries;
    let sortByText = '';
    switch (selectedOption) {
      case 'sort_alphabetically':
        sortedCountries = await fetchAllCountries();
        sortedCountries.sort((a, b) => {
          const nameA = (a.name && a.name.common) || "";
          const nameB = (b.name && b.name.common) || "";
          return nameA.localeCompare(nameB);
        });
        sortByText = 'Alphabetical order';
        break;
      case 'sort_by_population':
        sortedCountries = await fetchAllCountries();
        sortedCountries.sort((a, b) => b.population - a.population);
        sortByText = 'Population size';
        break;
      case 'sort_by_land_area':
        sortedCountries = await fetchAllCountries();
        sortedCountries.sort((a, b) => b.area - a.area);
        sortByText = 'Land area';
        break;
      default:
        console.log('Invalid option selected');
    }
    await displaySortedCountries(client, body.channel.id, sortedCountries, sortByText);
  } catch (error) {
    console.error('Error handling dropdown action:', error);
  }
});

async function displaySortedCountries(client, channelId, countries, sortBy) {
  try {
    const chunkArray = (arr, chunkSize) => {
      const result = [];
      for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize));
      }
      return result;
    };

    const countryChunks = chunkArray(countries, 50); // Split into chunks of max 50 countries
    for (let i = 0; i < countryChunks.length; i++) {
      const countryList = countryChunks[i].map(country => {
        let value;
        if (sortBy === 'Population size') {
          value = `*${country.population.toLocaleString()}*: ${country.name.common}`;
        } else if (sortBy === 'Land area') {
          value = `*${country.area.toLocaleString()} sqm*: ${country.name.common}`;
        } else {
          value = country.name.common;
        }
        return value;
      });
      const blocks = [
        ...(i === 0 ? [
          {
        "type": "divider"
          },
          {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:card_file_box: Sorting countries by *${sortBy}*`
          }
        }] : []),
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: countryList.join('\n'),
          },
        },
        {
        "type": "divider"
        }
      ];
      await client.chat.postMessage({
        channel: channelId,
        blocks: blocks,
      });
    }
  } catch (error) {
    console.error('Error displaying sorted countries.', error);
  }
}

(async () => {
  await app.start();
  console.log("All Countries app is running!");
})();
