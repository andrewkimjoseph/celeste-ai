/**
 * Strip trailing punctuation often swallowed by autolink regexes, e.g.
 * `(https://example.com).` → href `https://example.com`, trailing `).`
 */
export function trimTrailingUrlPunctuation(raw: string): {
  href: string;
  trailing: string;
} {
  let href = raw;
  let trailing = "";

  while (href.length > 0) {
    const last = href.at(-1)!;

    if (last === ")") {
      const opens = (href.match(/\(/g) ?? []).length;
      const closes = (href.match(/\)/g) ?? []).length;
      if (closes > opens) {
        trailing = last + trailing;
        href = href.slice(0, -1);
        continue;
      }
      break;
    }

    if (/[.,;:!?'\]}>]/.test(last)) {
      trailing = last + trailing;
      href = href.slice(0, -1);
      continue;
    }

    break;
  }

  return { href, trailing };
}
