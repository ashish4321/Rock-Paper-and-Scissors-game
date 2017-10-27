var userChoice = prompt("Do you choose rock, paper or scissors?");

for(var i=1;i>0;i++)
{
  if(userChoice===null)
  {
    alert("Your choice is wrong");
    var p= confirm("Do you want to chose again?");
    console.log(p);
    if(p == true)
    {
      userChoice = prompt("Do you choose rock, paper or scissors?");
    }
    else
    {
      break;
    }

  }

  else if (userChoice==="rock" || userChoice==="paper" || userChoice==="scissors")
  {
    document.write("<p>Player :" + " " + userChoice + "</p>");
    var computerChoice = Math.random();
    if (computerChoice < 0.34)
    {
      computerChoice = "rock";
    }
    else if(computerChoice <= 0.67)
    {
      computerChoice = "paper";
    }
    else
    {
      computerChoice = "scissors";
    }
    document.write("<p>Computer:" + " " + computerChoice + "</p>");
    var compare=function(choice1,choice2)
    {
      if (choice1 === choice2)
      {
        return( "The result is a tie!")
      }
      else if(choice1 === "rock")
      {
        if(choice2==="scissors")
        {
          return("rock wins")
        }
        else
        {
          return("paper wins")
        }
      }
      else if(choice1 === "paper")
      {
        if(choice2==="rock")
        {
          return( "paper wins")
        }
        else
        {
          return("scissors wins")
        }
      }
      else if(choice1 === "scissors")
      {
        if(choice2==="paper")
        {
          return("scissors wins")
        }
        else
        {
          return("rock wins")
        }
      }
    }
    var results = compare(userChoice,computerChoice);
    // Display results
    document.write("<br><hr><br>" + results);

    break;
  }
  else
  {
    var p= confirm("Your choice did not match.Do you want to chose again?");
    console.log(p);
    if(p == true)
    {
      userChoice = prompt("Do you choose rock, paper or scissors?");
    }
    else
    {
      document.write("<br><hr><br>"+"You did not choose anything.Refresh this page to choose again".bold());
      break;
    }
  }
}
