import 'package:flutter/material.dart';

class FilterBar extends StatelessWidget {
  const FilterBar({
    super.key,
    this.title,
    this.filters = const [],
  });

  final String? title;
  final List<Widget> filters;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (title != null)
          Text(
            title!,
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ...filters,
      ],
    );
  }
}

