import { styles } from "@/lib/styles";

export default function PhilosophyTab() {
  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <h2>Team Philosophy</h2>
        <p>
          We are not chasing perfect golf. We are trying to avoid big numbers.
        </p>
        <p>Double bogey is success. Bogey is a bonus.</p>

        <h3>Shot Budget</h3>
        <p>Par 3: 2 shots to get near the green, then 1 chip and 2 putts.</p>
        <p>Par 4: 3 shots to get near the green, then 1 chip and 2 putts.</p>
        <p>Par 5: 4 shots to get near the green, then 1 chip and 2 putts.</p>

        <h3>Short Game Identity</h3>
        <p>We are a chip-and-run team.</p>
        <p>Land the ball on the green and let it roll like a putt.</p>
        <p>One chip, then 2 putts.</p>

        <h3>What We Track</h3>
        <p>Scores, penalties, 3-putts, doubles or worse, and notes.</p>
      </div>
    </section>
  );
}