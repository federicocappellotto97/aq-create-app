#!/usr/bin/env node

import { program } from "commander"
import chalk from "chalk"
import inquirer from "inquirer"
import figlet from "figlet"
import yoctoSpinner from "yocto-spinner"
import { exec } from "child_process"
import util from "util"
import { fileURLToPath } from "url"
import { dirname } from "path"

const execAsync = util.promisify(exec)
const aqBlue = chalk.hex("#002AFF")
const LOG_STYLES = { default: "\x1b[36m%s\x1b[0m", error: "\x1b[31m%s\x1b[0m" }
const SPINNER_CONFIG = { color: aqBlue }

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const REPOS = {
  Corporate: {
    url: "https://AQuest@dev.azure.com/AQuest/Frontenders/_git/boiler-react-corporate",
    name: "boiler-react-corporate",
  },
  Creative: {
    url: "https://AQuest@dev.azure.com/AQuest/Frontenders/_git/boiler-react-creative",
    name: "boiler-react-creative",
  },
}

const questions = [
  {
    type: "input",
    name: "project-name",
    message: "Enter the project name:",
    default: "aq-project",
    validate: (input) => {
      const slug = input.toLowerCase().replace(/\s+/g, "-")
      if (slug !== input) {
        return `Project name should be a slug (all lowercase, no spaces, use hyphens). Suggested: ${slug}`
      }
      return true
    },
  },
  {
    type: "list",
    name: "type-of-project",
    message: "What type of project would you like to start?",
    choices: Object.keys(REPOS),
  },
]

const questionsAfterCloning = [
  {
    type: "confirm",
    name: "have-a-repository",
    message: "Do you already have a repository?",
  },
  {
    type: "input",
    name: "repository-remote-url",
    message: "Enter the repository remote URL:",
    when: (answers) => answers?.["have-a-repository"],
  },
]

console.clear()
console.log(aqBlue(figlet.textSync("AQuest", { horizontalLayout: "full" })))

program.version("1.0.0").description("AQuest create app")

program.action(async () => {
  try {
    const answers = await inquirer.prompt(questions)
    const spinner = yoctoSpinner({
      text: aqBlue("Cloning repo..."),
      ...SPINNER_CONFIG,
    }).start() // Start the spinner
    const directory = `./${answers["project-name"]}`
    const execOptions = { cwd: directory, stdio: [] }

    try {
      // Calculate time passed cloning
      const timePassed = new Date()

      await execAsync(
        `git clone --depth 1 ${
          REPOS[answers["type-of-project"]].url
        } ${directory}`
      )

      spinner.success(
        chalk.green(
          `Repository cloned successfully in ${Math.ceil(
            (new Date() - timePassed) / 1000
          )}s!`
        )
      )
    } catch (error) {
      await execAsync(`rm -rf ${directory}`)
      spinner.error(chalk.red(error))
      return
    }

    const spinner2 = yoctoSpinner({
      text: aqBlue("Setupping yarn and removing git..."),
      ...SPINNER_CONFIG,
    }).start()
    try {
      await execAsync(`sh ${__dirname}/install-yarn-berry.sh ${directory}`)
      await execAsync(`sh ${__dirname}/init-project.sh ${directory}`)
      spinner2.success(
        chalk.green(`Yarn setupped and git removed successfully!`)
      )
    } catch (error) {
      await execAsync(`rm -rf ${directory}`)
      spinner2.error(chalk.red(error))
      return
    }

    const spinner3 = yoctoSpinner({
      text: aqBlue("Installing node_modules..."),
      ...SPINNER_CONFIG,
    }).start()
    try {
      await execAsync(`yarn install`, execOptions)
      spinner3.success(chalk.green(`node_modules installed successfully!`))
    } catch (error) {
      await execAsync(`rm -rf ${directory}`)
      spinner3.error(chalk.red(error))
      return
    }

    const secondAnswers = await inquirer.prompt(questionsAfterCloning)
    if (secondAnswers?.["repository-remote-url"]) {
      const spinner4 = yoctoSpinner({
        text: aqBlue("Pushing repository to remote"),
        ...SPINNER_CONFIG,
      }).start()
      try {
        await execAsync(
          `git remote add origin ${secondAnswers?.["repository-remote-url"]}`,
          execOptions
        )
        await execAsync(`git add .`, execOptions)
        await execAsync(`git commit -m "first commit"`, execOptions)
        await execAsync(`git branch -M master`, execOptions)
        await execAsync(`git push -u origin master`, execOptions)

        spinner4.success(
          chalk.green(`Repository added and pushed successfully!`)
        )
      } catch (error) {
        spinner4.error(chalk.red(error))
        return
      }
    }
    console.log(
      chalk.green(
        `\n🚀 Project ${chalk.bold(
          answers["project-name"]
        )} created successfully!
    \n👉 ${chalk.bold(`cd ${answers["project-name"]}`)} to start working on it!`
      )
    )
  } catch (error) {
    console.error(
      LOG_STYLES.error,
      `\n❌ Error with inquirer prompt: ${error.message}`
    )
  }
})

program.parse(process.argv)
