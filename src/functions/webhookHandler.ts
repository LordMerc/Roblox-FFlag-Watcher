import { EmbedBuilder, WebhookClient } from 'discord.js'

const webhookClient = new WebhookClient({
  id: process.env.WEBHOOK_ID,
  token: process.env.WEBHOOK_TOKEN
})

export interface SubmitAdditionData {
  flagType: string // Assuming flagType is always a string
  key: string // Assuming key is always a string
  value: any
}
export async function submitAdditions(data: SubmitAdditionData) {
  const str = '```$```'
  const embed = new EmbedBuilder()
    .setTitle(`Added ${data.flagType} \`${data.key}\` `)
    .setColor(0x00ffff)
    .addFields([
      {
        name: 'Containing',
        value: str.replace('$', data.value),
        inline: true
      }
    ])
  await webhookClient.send({
    username: 'some-username',
    avatarURL: 'https://i.imgur.com/AfFp7pu.png',
    embeds: [embed]
  })
}
export interface SubmitDeletionData {
  flagType: string // Assuming flagType is always a string
  key: string // Assuming key is always a string
}
export async function submitDeletions(data: SubmitDeletionData) {
  const str = '```$```'
  const embed = new EmbedBuilder()
    .setTitle(`Deleted ${data.flagType} \`${data.key}\` `)
    .setColor(0x00ffff)

  await webhookClient.send({
    username: 'some-username',
    avatarURL: 'https://i.imgur.com/AfFp7pu.png',
    embeds: [embed]
  })
}
export interface SubmitChangesData {
  flagType: string // Assuming flagType is always a string
  key: string // Assuming key is always a string
  changeData: {
    oldValue: any // You can replace `any` with the actual type of oldValue
    newValue: any
  }
}
export async function submitChanges(data: SubmitChangesData) {
  const str = '```$```'
  const embed = new EmbedBuilder()
    .setTitle(`Changed ${data.flagType} \`${data.key}\` `)
    .setColor(0x00ffff)
    .addFields([
      {
        name: 'From',
        value: str.replace('$', data.changeData.oldValue),
        inline: true
      },
      {
        name: 'To',
        value: str.replace('$', data.changeData.newValue),
        inline: true
      }
    ])

  await webhookClient.send({
    username: 'some-username',
    avatarURL: 'https://i.imgur.com/AfFp7pu.png',
    embeds: [embed]
  })
}
