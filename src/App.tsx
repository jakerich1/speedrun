import Input from "./components/Input";
import Button from "./components/Button";
import ErrorAlert from "./components/Alert";
import { useState, useEffect } from "react";
import { promptOpenAi } from "./lib/open-ai";
import useLocalStorage from "./hooks/useLocalStorage";

const App = () => {
  const [guessing, setGuessing] = useState<boolean>(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [guessResult, setGuessResult] = useState<string | null>(null);
  const [goalArticle, setGoalArticle] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [currentArticle, setCurrentArticle] = useState<string | null>(null);
  const [currentLinkCount, setCurrentLinkCount] = useState<number | null>(null);
  const [goalArticleSummary, setGoalArticleSummary] = useState<string | null>(
    null
  );

  const [position, setPosition] = useState({ x: 10, y: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [openAiKey, setOpenAiKey] = useLocalStorage("openAiKey", "");

  // Establish goal article
  useEffect(() => {
    const interval = setInterval(() => {
      if (!goalArticle) {
        const goalArticleText = getGoalArticleByText();
        if (goalArticleText) {
          setGoalArticle(goalArticleText);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [goalArticle]);

  useEffect(() => {
    if (!goalArticle) return;

    const encodedTitle = encodeURIComponent(goalArticle);

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.extract) {
          setGoalArticleSummary(data.extract);
        }
      })
      .catch((err) => {
        console.error("Error fetching summary for goal article:", err);
      });
  }, [goalArticle]);

  // Dragging logic for widget placement
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const getGoalArticleByText = () => {
    const infoElement = Array.from(document.querySelectorAll("small")).find(
      (el) => el.textContent?.includes("ⓘ")
    );

    if (infoElement) {
      const parentElement = infoElement.closest(
        ".col-sm-auto.text-nowrap.px-4.pt-2"
      );

      if (parentElement) {
        const textContent = parentElement.textContent?.trim();
        const goalArticle = textContent
          ? textContent
              .split("\n")
              .find(
                (line) => line.trim() !== "Goal Article" && line.trim() !== "ⓘ"
              )
          : null;

        return goalArticle?.trim().replace("Goal Article", "");
      }
    }

    return null;
  };

  const getCurrentArticle = () => {
    setCurrentArticle(null);

    const currentArticleElements = Array.from(
      document.querySelectorAll(".col-lg-auto.text-nowrap.px-4.py-2")
    );

    const articles = currentArticleElements
      .map((el) => {
        if (el.textContent?.includes("Current Article")) {
          const strongElement = el.querySelector("strong");
          return strongElement ? strongElement.textContent?.trim() : null;
        }
        return null;
      })
      .filter(Boolean);

    if (articles[0]) {
      return articles[0];
    }

    return null;
  };

  const getWikiLinks = () => {
    setCurrentLinkCount(null);

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.remove();
    }

    const wikiLinks = Array.from(
      document.querySelectorAll('a[href^="/wiki/"]')
    ).filter(
      (link) =>
        link.getBoundingClientRect().width > 0 &&
        link.getBoundingClientRect().height > 0
    );

    const results = wikiLinks
      .map((link) => {
        const href = link.getAttribute("href");
        const text = link.textContent?.trim();

        if (href && text) {
          return { href, text };
        }
      })
      .filter((link) => {
        return link !== undefined;
      });

    return results;
  };

  const handleFullReset = () => {
    setGoalArticle(null);
    setCurrentArticle(null);
    setCurrentLinkCount(null);
    setGuessResult(null);
    setGeneralError(null);
    setGoalArticleSummary(null);
  };

  const guessLink = async () => {
    setGeneralError(null);

    const links = getWikiLinks();
    setCurrentLinkCount(links.length);

    const currentArticle = getCurrentArticle();

    if (!links.length) {
      setGeneralError("No links found");
      return;
    }

    if (!openAiKey) {
      setGeneralError("OpenAI API key is missing");
      return;
    }

    if (!currentArticle) {
      setGeneralError("Current article is missing");
      return;
    }

    if (!goalArticle) {
      setGeneralError("Goal article is missing");
      return;
    }

    setGuessing(true);

    const prompt = `
    I am currently on the article "${currentArticle}". 
    I need to get to the article "${goalArticle}". 
    ${
      goalArticleSummary
        ? `Here is context about the goal article: ${goalArticleSummary}`
        : ""
    }
    I have ${links.length} links to choose from. 
    Which link will get me closer to the target article? 
    These are the links: ${links.map((link) => link.text)}
    
    You must respond in JSON format with the link text you think I should click on. 
    The structure should be: { "link": "link text" }
  `;

    console.log("Prompt:", prompt);

    try {
      const promptResult = await promptOpenAi(prompt, openAiKey, {
        enforceJsonResponse: true,
      });

      console.log("Prompt result:", promptResult);

      const chatResponseContent = promptResult.choices[0].message.content;
      const chatResponse = JSON.parse(chatResponseContent ?? "") as unknown;

      if (typeof chatResponse !== "object" || chatResponse === null) {
        setGeneralError("Invalid response from OpenAI");
        return;
      }

      if (!("link" in chatResponse)) {
        setGeneralError("Invalid response from OpenAI");
        return;
      }

      const guessedLink = chatResponse["link"];

      if (typeof guessedLink !== "string") {
        setGeneralError("Invalid response from OpenAI");
        return;
      }

      findAndHighlightAnchorLink(guessedLink);
      setGuessResult(guessedLink);
    } catch (error) {
      console.error("Error guessing link:", error);
      setGeneralError("Error guessing link");
    } finally {
      setGuessing(false);
    }
  };

  const findAndHighlightAnchorLink = (text: string) => {
    const anchorLinks = Array.from(document.querySelectorAll("a")).filter(
      (link) => link.textContent === text.trim()
    );

    if (anchorLinks.length > 0) {
      anchorLinks[0].scrollIntoView();
      anchorLinks[0].style.border = "2px solid red";
    } else {
      setGeneralError("Link not found");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      id="app"
      onMouseDown={handleMouseDown}
      style={{
        top: position.y,
        left: position.x,
        width: 400,
        padding: 16,
        zIndex: 9999,
        borderRadius: 10,
        display: "block",
        position: "fixed",
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        boxShadow:
          "rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2>WikiGPT</h2>
        <Button onClick={handleFullReset}>Reset</Button>
      </div>

      {generalError && <ErrorAlert message={generalError} />}

      {goalArticle && (
        <p>
          <b>Goal article:</b> {goalArticle}
        </p>
      )}
      {currentArticle && (
        <p>
          <b>Current article:</b> {currentArticle}
        </p>
      )}
      {currentLinkCount && (
        <p>
          <b>Current links count:</b> {currentLinkCount}
        </p>
      )}
      {guessResult && (
        <p>
          <b>Guessed link:</b> {guessResult}
        </p>
      )}

      {!openAiKey ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Input
            value={newApiKey || ""}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="OpenAI API key"
          />
          <Button
            onClick={() => {
              setOpenAiKey(newApiKey || "");
            }}
          >
            Save API key
          </Button>
        </div>
      ) : (
        <Button
          loading={guessing}
          onClick={() => {
            void guessLink();
          }}
        >
          Guess
        </Button>
      )}
    </div>
  );
};

export default App;
